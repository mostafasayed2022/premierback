# Backend Changes — Premier Health Clinics Analytics

## Overview

These changes must be applied manually to the Django backend at:
`F:\PremierCare\PremierCare\premierhealthcare\`

> Run `python manage.py makemigrations` and `python manage.py migrate` after applying.

---

## 1. Booking Model — Add Attribution Fields

**File**: `premierhealthcare/client/models.py`

Add the following fields to the `Booking` model (check if any already exist first — do NOT duplicate):

```python
# ─── Attribution / Campaign Tracking Fields ──────────────────────────────────
# Zero-PII: only campaign/click IDs and landing page URLs are stored here.

# UTM parameters
utm_source = models.CharField(max_length=500, blank=True, null=True)
utm_medium = models.CharField(max_length=500, blank=True, null=True)
utm_campaign = models.CharField(max_length=500, blank=True, null=True)
utm_content = models.CharField(max_length=500, blank=True, null=True)
utm_term = models.CharField(max_length=500, blank=True, null=True)

# Ad platform campaign identifiers
campaign_id = models.CharField(max_length=500, blank=True, null=True)
adset_id = models.CharField(max_length=500, blank=True, null=True)
ad_id = models.CharField(max_length=500, blank=True, null=True)

# Google click IDs
gclid = models.CharField(max_length=500, blank=True, null=True)
gbraid = models.CharField(max_length=500, blank=True, null=True)
wbraid = models.CharField(max_length=500, blank=True, null=True)

# Platform click IDs
fbclid = models.CharField(max_length=500, blank=True, null=True)
ttclid = models.CharField(max_length=500, blank=True, null=True)
scclid = models.CharField(max_length=500, blank=True, null=True)
sc_click_id = models.CharField(max_length=500, blank=True, null=True)

# Attribution meta
landing_page = models.CharField(max_length=2000, blank=True, null=True)
referrer = models.CharField(max_length=2000, blank=True, null=True)
```

---

## 2. BookingStatus — Add ATTENDED

**File**: `premierhealthcare/client/models.py`

Find the `BookingStatus` or `Booking.status` choices and add:

```python
class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    CANCELLED = "cancelled", "Cancelled"
    COMPLETED = "completed", "Completed"
    ATTENDED = "attended", "Attended"  # Patient physically attended
```

---

## 3. OfflineConversion Model

**File**: `premierhealthcare/client/models.py`

Add this new model:

```python
class OfflineConversion(models.Model):
    """
    Records offline conversion events for appointment attendance and payments.
    Idempotent: unique constraint on (booking, event_name).
    """

    class EventName(models.TextChoices):
        APPOINTMENT_ATTENDED = "appointment_attended", "Appointment Attended"
        PURCHASE = "purchase", "Purchase"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    booking = models.ForeignKey(
        "Booking",
        on_delete=models.CASCADE,
        related_name="offline_conversions",
    )
    event_name = models.CharField(
        max_length=100,
        choices=EventName.choices,
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.PENDING,
    )
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="EGP")
    conversion_time = models.DateTimeField(auto_now_add=True)

    # Attribution fields (copied from booking for offline matching)
    utm_source = models.CharField(max_length=500, blank=True, null=True)
    utm_campaign = models.CharField(max_length=500, blank=True, null=True)
    gclid = models.CharField(max_length=500, blank=True, null=True)
    fbclid = models.CharField(max_length=500, blank=True, null=True)
    ttclid = models.CharField(max_length=500, blank=True, null=True)
    sc_click_id = models.CharField(max_length=500, blank=True, null=True)

    # Raw payload for debugging/re-sending
    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents duplicate conversions for the same booking+event
        unique_together = [("booking", "event_name")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_name} — Booking #{self.booking_id}"
```

---

## 4. Signal for appointment_attended

**File**: `premierhealthcare/client/signals.py`

```python
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.db import transaction


@receiver(pre_save, sender=Booking)
def track_attended_transition(sender, instance, **kwargs):
    """
    Create an OfflineConversion when booking status transitions to ATTENDED.
    Uses idempotent get_or_create to prevent duplicates.
    """
    if not instance.pk:
        return  # New booking — skip

    try:
        previous = Booking.objects.get(pk=instance.pk)
    except Booking.DoesNotExist:
        return

    # Only fire when transitioning TO "attended" (not re-saving from attended)
    if previous.status != "attended" and instance.status == "attended":
        def create_conversion():
            OfflineConversion.objects.get_or_create(
                booking=instance,
                event_name=OfflineConversion.EventName.APPOINTMENT_ATTENDED,
                defaults={
                    "value": getattr(instance, "fee", None),
                    "currency": "EGP",
                    "utm_source": instance.utm_source,
                    "utm_campaign": instance.utm_campaign,
                    "gclid": instance.gclid,
                    "fbclid": instance.fbclid,
                    "ttclid": instance.ttclid,
                    "sc_click_id": instance.sc_click_id,
                    "payload": {
                        "booking_id": instance.pk,
                        "service_id": getattr(instance.service, "id", None),
                        "branch_id": getattr(instance.branch, "id", None),
                    },
                },
            )

        # Use on_commit to avoid creating conversion on rolled-back transactions
        transaction.on_commit(create_conversion)
```

---

## 5. AttributionSerializer

**File**: `premierhealthcare/client/serializersfiles/bookingserializers.py`

```python
from rest_framework import serializers

# Whitelist of allowed attribution fields
ATTRIBUTION_ALLOWED_FIELDS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "campaign_id", "adset_id", "ad_id",
    "gclid", "gbraid", "wbraid",
    "fbclid", "ttclid", "scclid", "sc_click_id",
    "landing_page", "referrer",
}


class AttributionSerializer(serializers.Serializer):
    """
    Strict whitelist serializer for campaign attribution data.
    Only accepts approved fields. Rejects unknown keys silently.
    Zero-PII: never accepts name, email, phone, or medical data.
    """
    utm_source = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    utm_medium = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    utm_campaign = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    utm_content = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    utm_term = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    campaign_id = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    adset_id = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    ad_id = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    gclid = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    gbraid = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    wbraid = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    fbclid = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    ttclid = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    scclid = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    sc_click_id = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    landing_page = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)
    referrer = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Existing serializer — add attribution as optional nested field.
    Old requests without attribution continue to work unchanged.
    """
    # Add this field to existing serializer
    attribution = AttributionSerializer(required=False, write_only=True)

    def create(self, validated_data):
        attribution = validated_data.pop("attribution", {})
        booking = super().create(validated_data)

        # Save attribution fields to booking
        if attribution:
            for field, value in attribution.items():
                if hasattr(booking, field) and value:
                    setattr(booking, field, value)
            booking.save(update_fields=list(attribution.keys()))

        return booking
```

---

## 6. Paymob Webhook — purchase OfflineConversion

**File**: `premierhealthcare/client/viewsfiles/paymentviews.py`

In the existing Paymob webhook handler, after HMAC validation and confirming `success == True`:

```python
# After confirming payment success:
from django.db import transaction

def handle_successful_payment(booking):
    """Create idempotent purchase OfflineConversion."""
    def create_purchase_conversion():
        OfflineConversion.objects.get_or_create(
            booking=booking,
            event_name=OfflineConversion.EventName.PURCHASE,
            defaults={
                "value": booking.fee,
                "currency": "EGP",
                "utm_source": booking.utm_source,
                "utm_campaign": booking.utm_campaign,
                "gclid": booking.gclid,
                "fbclid": booking.fbclid,
                "ttclid": booking.ttclid,
                "sc_click_id": booking.sc_click_id,
                "payload": {
                    "booking_id": booking.pk,
                    "transaction_id": booking.payment_transaction_id,
                    "service_id": getattr(booking.service, "id", None),
                },
            },
        )
    transaction.on_commit(create_purchase_conversion)
```

---

## 7. Migration Command

After applying all model changes:

```bash
cd F:\PremierCare\PremierCare
python manage.py makemigrations
python manage.py migrate
python manage.py check
```

---

## 8. Register OfflineConversion in Admin (Optional)

```python
# admin.py
from django.contrib import admin
from .models import OfflineConversion

@admin.register(OfflineConversion)
class OfflineConversionAdmin(admin.ModelAdmin):
    list_display = ["booking", "event_name", "status", "value", "currency", "conversion_time"]
    list_filter = ["event_name", "status"]
    search_fields = ["booking__id", "gclid", "fbclid"]
    readonly_fields = ["conversion_time", "created_at"]
```
