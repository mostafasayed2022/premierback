
# models.py
from datetime import timezone , timedelta
import random
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from django.conf import settings
from django.utils import timezone

import uuid
from apps.files.models import File


# ─── Roles / Users ───────────────────────────────────────────────────────

class Role(models.TextChoices):
    ADMIN = 'admin', _('Admin')
    DOCTOR = 'doctor', _('Doctor')
    PATIENT = 'patient', _('Patient')


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not username:
            raise ValueError("The Username field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Role.ADMIN)
        extra_fields.setdefault("is_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Meta:
      verbose_name_plural = "admin-users"
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PATIENT)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_guest = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    def get_full_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.username

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_doctor(self):
        return self.role == Role.DOCTOR

    @property
    def is_patient(self):
        return self.role == Role.PATIENT


#------- reset passsword ---------------

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} - {self.code}"

    @classmethod
    def generate_for_user(cls, user):
        # Invalidate old codes
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        code = str(random.randint(100000, 999999))
        otp = cls.objects.create(user=user, code=code)
        return otp

    def is_valid(self):
        # Valid if not used and not expired (15 minutes)
        expiry = self.created_at + timedelta(minutes=15)
        return not self.is_used and timezone.now() <= expiry


# ─── Department / Service / Branch ───────────────────────────────────────

class Department(models.Model):
    """Top-level category a patient starts from, e.g. 'Cardiology'."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    image = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='departments'
    )
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.icon is None:
            self.icon = ""
        super().save(*args, **kwargs)


class Service(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=150)
    slug = models.SlugField(blank=True)
    image = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='services'
    )
    description = models.TextField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    default_fee = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["department", "name"]
        constraints = [
            models.UniqueConstraint(fields=["department", "slug"], name="unique_service_slug_per_department"),
        ]

    def __str__(self):
        return f"{self.name} ({self.department.name})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Branch(models.Model):
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    image = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='branches'
    )
    city = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    url = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    services = models.ManyToManyField(Service, related_name="branches", blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "branches"

    def __str__(self):
        return f"{self.name} — {self.city}"


# class BranchService(models.Model):
#     branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
#     service = models.ForeignKey(Service, on_delete=models.CASCADE)
#     fee_override = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

#     class Meta:
#         constraints = [
#             models.UniqueConstraint(fields=["branch", "service"], name="unique_branch_service"),
#         ]

#     def __str__(self):
#         return f"{self.branch.name} — {self.service.name}"

#     @property
#     def effective_fee(self):
#         return self.fee_override if self.fee_override is not None else self.service.default_fee


# # ─── Doctor / Patient ─────────────────────────────────────────────────────

class Doctor(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=100)
    position = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    image = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='doctors'
    )
    bio = models.TextField(blank=True)
    experience = models.PositiveIntegerField(default=10, blank=True, null=True, help_text="Years of Experience")
    patients = models.PositiveIntegerField(default=500, blank=True, null=True, help_text="Number of Patients Served")
    languages = models.CharField(max_length=250, default="English, Arabic", blank=True, null=True, help_text="Languages spoken (comma-separated)")
    branches = models.ManyToManyField(Branch,  related_name="doctors")
    services = models.ManyToManyField(Service,  related_name="doctors")

    def __str__(self):
        return f"Dr. {self.user.username}"



# class DoctorBranch(models.Model):
#     doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
#     branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

#     class Meta:
#         constraints = [
#             models.UniqueConstraint(fields=["doctor", "branch"], name="unique_doctor_branch"),
#         ]

#     def __str__(self):
#         return f"{self.doctor} @ {self.branch}"


# class DoctorService(models.Model):
#     doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
#     service = models.ForeignKey(Service, on_delete=models.CASCADE)
#     fee_override = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

#     class Meta:
#         constraints = [
#             models.UniqueConstraint(fields=["doctor", "service"], name="unique_doctor_service"),
#         ]

#     def __str__(self):
#         return f"{self.doctor} — {self.service.name}"


class Patient(models.Model):
    class GenderChoices(models.TextChoices):
        MALE   = "male",   "Male"
        FEMALE = "female", "Female"
        OTHER  = "other",  "Other"

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='patient_profile')
    image = models.ForeignKey(
            File,
            on_delete=models.SET_NULL,
            null=True, blank=True,
            related_name='patients'
        )
    date_of_birth   = models.DateField(null=True, blank=True)
    phone_number    = models.CharField(max_length=20, blank=True, null=True)
    gender          = models.CharField(
                        max_length=10,
                        choices=GenderChoices.choices,
                        blank=True,
                        null=True,
                    )
    medical_history = models.TextField(blank=True)

    def __str__(self):
        return self.user.username

class Weekday(models.TextChoices):
    MONDAY = "monday", "Mon"
    TUESDAY = "tuesday", "Tue"
    WEDNESDAY = "wednesday", "Wed"
    THURSDAY = "thursday", "Thu"
    FRIDAY = "friday", "Fri"
    SATURDAY = "saturday", "Sat"
    SUNDAY = "sunday", "Sun"


class DoctorAvailability(models.Model):
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="availabilities",
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="availabilities",
    )
    weekday = models.CharField(max_length=10, choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["doctor", "branch", "weekday", "start_time"],
                name="unique_doctor_branch_slot",
            )


        ]

    def str(self):
        return f"{self.doctor} @ {self.branch} — {self.get_weekday_display()} {self.start_time} to {self.end_time}"
# ─── Booking / Payment ────────────────────────────────────────────────────

class BookingStatus(models.TextChoices):
    PENDING_PAYMENT = 'pending_payment', 'Pending Payment'
    PENDING = 'pending', 'Pending'
    CONFIRMED = 'confirmed', 'Confirmed'
    CANCELLED = 'cancelled', 'Cancelled'
    COMPLETED = 'completed', 'Completed'
    ATTENDED = 'attended', 'Attended'  # Patient physically attended
    EXPIRED = 'expired', 'Expired'


class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='bookings')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='bookings')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='bookings')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=BookingStatus.choices,
                               default=BookingStatus.PENDING_PAYMENT)
    fee = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    sc_click_id = models.CharField(max_length=500, blank=True, null=True)

    # Attribution meta
    landing_page = models.CharField(max_length=2000, blank=True, null=True)
    referrer = models.CharField(max_length=2000, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date', 'start_time'],
                condition=models.Q(status__in=['pending_payment', 'confirmed']),
                name='unique_active_slot'
            )
        ]
        indexes = [models.Index(fields=['doctor', 'date'])]

    def __str__(self):
        return f"{self.patient} -> {self.doctor} on {self.date} {self.start_time}"


class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'
    FAILED = 'failed', 'Failed'
    REFUNDED = 'refunded', 'Refunded'


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default='EGP')
    status = models.CharField(max_length=20, choices=PaymentStatus.choices,
                               default=PaymentStatus.PENDING)
    paymob_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    paymob_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    payment_token = models.TextField(blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    raw_webhook_payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.booking_id} - {self.status}"


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


# ─── Notifications ─────────────────────────────────────────────────────────




class GalleryCategory(models.TextChoices):
    FACILITY = 'facility', _('Facility')
    TREATMENT = 'treatment', _('Treatment')
    EQUIPMENT = 'equipment', _('Equipment')

# client/models.py (add after the existing Gallery and Testimonial definitions)

class MediaType(models.TextChoices):
    IMAGE = 'image', _('Image')
    VIDEO = 'video', _('Video')


class Gallery(models.Model):
    title = models.CharField(max_length=150)
    title_ar = models.CharField(max_length=150, blank=True, null=True)
    category = models.CharField(max_length=50, choices=GalleryCategory.choices, default=GalleryCategory.FACILITY)
    media_type = models.CharField(max_length=20, choices=MediaType.choices, default=MediaType.IMAGE)
    image = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='gallery_primary_images'
    )
    video = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='gallery_videos'
    )
    video_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    description_ar = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "galleries"

    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name="images")
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name="gallery_images")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = [["gallery", "file"]]


class Testimonial(models.Model):
    name = models.CharField(max_length=150)
    name_ar = models.CharField(max_length=150, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    role_ar = models.CharField(max_length=100, blank=True, null=True)
    rating = models.PositiveIntegerField(default=5)
    text = models.TextField()
    text_ar = models.TextField(blank=True, null=True)
    video_url = models.URLField(max_length=500, blank=True, null=True)
    video = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='testimonial_videos'
    )
    image = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True, related_name="testimonials")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class BranchGallery(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="branch_gallery_images"
    )
    title = models.CharField(max_length=150, blank=True, default="")
    title_ar = models.CharField(max_length=150, blank=True, default="")
    image = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="branch_gallery_files"
    )
    description = models.TextField(blank=True, default="")
    description_ar = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]
        verbose_name_plural = "branch galleries"

    def __str__(self):
        return f"{self.branch.name} - {self.title or self.id}"
