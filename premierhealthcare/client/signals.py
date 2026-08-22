from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import CustomUser, Doctor, Patient, Role, Booking, OfflineConversion


@receiver(post_save, sender=CustomUser)
def create_role_profile(sender, instance, created, **kwargs):
    print("SIGNAL:", created, instance.role)

    if not created:
        return

    if instance.role == Role.PATIENT:
        print("Creating patient")
        Patient.objects.get_or_create(user=instance)

    if instance.role == Role.DOCTOR:
        print("creatingdoctor")
        Doctor.objects.get_or_create(user=instance)


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
                        "booking_id": str(instance.pk),
                        "service_id": getattr(instance.service, "id", None),
                        "branch_id": getattr(instance.branch, "id", None),
                    },
                },
            )

        # Use on_commit to avoid creating conversion on rolled-back transactions
        transaction.on_commit(create_conversion)
