from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Doctor, Patient, Role


@receiver(post_save, sender=CustomUser)
def create_role_profile(sender, instance, created, **kwargs):
    print("SIGNAL:", created, instance.role)

    if not created:
        return

    if instance.role == Role.PATIENT:
        print("Creating patient")
        Patient.objects.get_or_create(user=instance)

    if instance.role==Role.DOCTOR:
        print("creatingdoctor")
        Doctor.objects.get_or_create(user=instance)
