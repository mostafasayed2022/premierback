# client/tasks.py
from celery import shared_task
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import CustomUser, Booking

@shared_task
def send_otp_email_task(user_id, otp_code):
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return
    subject = "Your Password Reset Code"
    message = (
        f"Hi {user.get_full_name()},\n\n"
        f"Your password reset code is: {otp_code}\n\n"
        f"This code expires in 15 minutes."
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_booking_confirmation_task(self, booking_id):
    try:
        booking = Booking.objects.select_related(
            'patient__user', 'doctor__user', 'service', 'branch'
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        return

    subject = f"Appointment Confirmed - {booking.service.name}"
    message = (
        f"Dear {booking.patient.user.get_full_name()},\n\n"
        f"Your appointment has been confirmed.\n\n"
        f"Doctor: Dr. {booking.doctor.user.get_full_name()}\n"
        f"Service: {booking.service.name}\n"
        f"Branch: {booking.branch.name}\n"
        f"Date: {booking.date}\n"
        f"Time: {booking.start_time}\n\n"
        f"Thank you for choosing {getattr(settings, 'CLINIC_NAME', 'Our Clinic')}.\n"
    )
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.patient.user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_booking_rescheduled_notification_task(self, booking_id, doctor_name, old_date, old_time):
    """
    Sent when a doctor directly reschedules a specific booking's date/time.
    """
    try:
        booking = Booking.objects.select_related(
            'patient__user', 'doctor__user', 'service', 'branch'
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        return

    subject = f"Your Appointment Time Has Changed - {booking.service.name}"
    message = (
        f"Dear {booking.patient.user.get_full_name()},\n\n"
        f"Your appointment with Dr. {doctor_name} has been rescheduled.\n\n"
        f"Previous time: {old_date} at {old_time}\n\n"
        f"New details:\n"
        f"Doctor: Dr. {doctor_name}\n"
        f"Service: {booking.service.name}\n"
        f"Branch: {booking.branch.name}\n"
        f"Date: {booking.date}\n"
        f"Time: {booking.start_time}\n\n"
        f"Your booking is still confirmed — no action needed unless this "
        f"new time doesn't work for you, in which case please contact us.\n\n"
        f"Thank you for choosing {getattr(settings, 'CLINIC_NAME', 'Our Clinic')}.\n"
    )

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.patient.user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)
