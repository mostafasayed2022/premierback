# utils/email.py


from django.conf import settings
from django.core.mail import send_mail

def send_otp_email(user, otp_code):
    subject = "Your Password Reset Code"
    message = (
        f"Hi {user.get_full_name()},\n\n"
        f"Your password reset code is: {otp_code}\n\n"
        f"This code expires in 15 minutes."
    )
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    send_mail(subject, message, from_email, recipient_list)