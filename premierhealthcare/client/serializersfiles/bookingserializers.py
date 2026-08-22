from client.models import Booking , BookingStatus ,Doctor,DoctorAvailability
from datetime import datetime, timedelta
from django.utils import timezone  
from rest_framework import serializers

from django.db import IntegrityError, transaction


# Whitelist of allowed attribution fields
ATTRIBUTION_ALLOWED_FIELDS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "campaign_id", "adset_id", "ad_id",
    "gclid", "gbraid", "wbraid",
    "fbclid", "ttclid", "sc_click_id",
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
    sc_click_id = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    landing_page = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)
    referrer = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)


class BookingCreateSerializer(serializers.ModelSerializer):
    attribution = AttributionSerializer(required=False, write_only=True)

    class Meta:
        model = Booking
        fields = [
            "doctor", "service", "branch", "date", "start_time", "end_time", "fee", "status",
            "attribution",
        ]
        read_only_fields = ["end_time", "fee"]

    def validate(self, attrs):
        instance = self.instance
        doctor = attrs.get("doctor", instance.doctor if instance else None)
        service = attrs.get("service", instance.service if instance else None)
        branch = attrs.get("branch", instance.branch if instance else None)
        date = attrs.get("date", instance.date if instance else None)
        start_time = attrs.get("start_time", instance.start_time if instance else None)

        if doctor is None or service is None or branch is None or date is None or start_time is None:
            raise serializers.ValidationError("Missing required booking fields.")

        # Past-date check
        if date < timezone.localdate():
            raise serializers.ValidationError({"date": "Cannot book a date in the past."})

        # Doctor works at branch
        if not doctor.branches.filter(id=branch.id).exists():
            raise serializers.ValidationError({"branch": "Doctor does not work at this branch."})

        # Doctor offers service
        if not doctor.services.filter(id=service.id).exists():
            raise serializers.ValidationError({"service": "Doctor does not offer this service."})

        # Availability check (same as before)
        availabilities = DoctorAvailability.objects.filter(
            doctor=doctor, branch=branch,
            weekday=date.strftime("%A").lower(),
        )
        if not availabilities.exists():
            raise serializers.ValidationError({"start_time": "Doctor is not available on this day."})

        # Check slot is within availability and not booked
        booked_qs = Booking.objects.filter(
            doctor=doctor, branch=branch, date=date,
            status__in=[BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED],
        )
        if instance is not None:
            booked_qs = booked_qs.exclude(pk=instance.pk)  # don't conflict with itself on update
        booked = set(booked_qs.values_list("start_time", flat=True))

        valid_slot = False
        calculated_end_time = None
        for avail in availabilities:
            cursor = datetime.combine(date, avail.start_time)
            end = datetime.combine(date, avail.end_time)
            step = timedelta(minutes=avail.slot_duration_minutes)
            while cursor + step <= end:
                if cursor.time() == start_time:
                    valid_slot = True
                    calculated_end_time = (cursor + step).time()
                    break
                cursor += step
            if valid_slot:
                break
        if not valid_slot:
            raise serializers.ValidationError({"start_time": "Slot is outside doctor's available hours."})
        if start_time in booked:
            raise serializers.ValidationError({"start_time": "This slot is already booked."})

        attrs["end_time"] = calculated_end_time
        return attrs

    def create(self, validated_data):
        attribution = validated_data.pop("attribution", {})
        # Fee is set to service's default fee (no overrides)
        service = validated_data.get("service")
        if service and hasattr(service, "default_fee"):
            validated_data["fee"] = service.default_fee

        try:
            with transaction.atomic():
                booking = super().create(validated_data)

                # Save attribution fields to booking
                if attribution:
                    fields_to_update = []
                    for field, value in attribution.items():
                        if hasattr(booking, field) and value:
                            setattr(booking, field, value)
                            fields_to_update.append(field)
                    if fields_to_update:
                        booking.save(update_fields=fields_to_update)

                return booking
        except IntegrityError:
            raise serializers.ValidationError(
                {"start_time": "This slot was just booked by someone else. Please pick another."}
            )

    def update(self, instance, validated_data):
        # If service changed, keep fee consistent with the new service's default.
        # If service wasn't part of this PATCH, leave fee untouched.
        if "service" in validated_data:
            validated_data["fee"] = validated_data["service"].default_fee

        try:
            with transaction.atomic():
                return super().update(instance, validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"start_time": "This slot was just booked by someone else. Please pick another."}
            )

class BookingSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        print("BOOKING SERIALIZER USED")
        return super().to_representation(instance)
    patient = serializers.CharField(source="patient.user.get_full_name", read_only=True)
    doctor = serializers.CharField(source="doctor.user.get_full_name", read_only=True)
    service = serializers.CharField(source="service.name", read_only=True)
    branch = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "patient",
            "doctor",
            "service",
            "branch",
            "date",
            "start_time",
            "end_time",
            "status",
            "fee",
            "notes",
            "created_at",
        ]
