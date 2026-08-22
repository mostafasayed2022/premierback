"""
client/admin_schema.py

Explicit schema registrations for all client app models.

Design rules:
  - use_explicit_viewset = True  → hand-written ViewSet in urls.py handles CRUD;
    schema is still introspectable via /api/schema/ (React renders the form).
  - read_serializer_class / write_serializer_class → used by the dynamic router
    when use_explicit_viewset is False.
  - list_display fields must EXIST in the serializer or model — a typo here
    causes a silently empty column in the React table.
"""
from apps.schema.registry import registry
from apps.schema.base import AdminSchema 
from .models import (
    Branch, Doctor, Patient, DoctorAvailability,
    Booking, CustomUser, Department, Service,
    GalleryImage, Gallery, GalleryCategory, Testimonial,
    BranchGallery, OfflineConversion,
)
from .serializers import (
    BranchSerializer,
    DoctorSerializer,
    DoctorAvailabilitySerializer,
    DoctorAvailabilityWriteSerializer,
    PatientSerializer,
    BookingSerializer,
    BookingCreateSerializer,
    DepartmentSerializer,
    ServiceSerializer,
    CustomUserSerializer,
    TestimonialSerializer,
    GallerySerializer,
    BranchGallerySerializer,
)                                 

@registry.register
class DepartmentSchema(AdminSchema):
    model                  = Department
    endpoint               = "/api/department/"
    read_serializer_class  = DepartmentSerializer
    write_serializer_class = DepartmentSerializer
    list_display           = ["id", "name", "slug", "description", "is_active", "image_url"]
    search_fields          = ["name", "description"]
    ordering               = ["name"]
    exclude = ["image", "icon"]                     # 👈 remove the auto‑generated FK field & icon

    @classmethod
    def get_fields(cls) -> list:
        fields = super().get_fields()
        for f in fields:
            if f.name == "image_id":
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name == "branches":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/branches/"
                f.required = False
            elif f.name == "services":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/services/"
                f.required = False
        return fields

@registry.register
class ServiceSchema(AdminSchema):
    model                  = Service
    endpoint               = "/api/services/"
    read_serializer_class  = ServiceSerializer
    write_serializer_class = ServiceSerializer
    list_display           = ["id", "name", "slug", "description", "is_active", "image_url"]
    search_fields          = ["name", "description", "department__name"]
    ordering               = ["slug"]
    exclude = ["image", "icon"]                     # 👈 remove the auto‑generated FK field & icon

    @classmethod
    def get_fields(cls) -> list:
        fields = super().get_fields()
        for f in fields:
            if f.name == "image_id":
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name == "branches":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/branches/"
                f.required = False
            elif f.name == "services":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/services/"
                f.required = False
        return fields

@registry.register
class BranchSchema(AdminSchema):
    model                  = Branch
    endpoint               = "/api/branches/"
    read_serializer_class  = BranchSerializer
    write_serializer_class = BranchSerializer
    list_display           = ["id", "name", "services","city", "phone", "is_active","image_url"]
    search_fields          = ["name", "city", "address"]
    ordering               = ["name"]
    exclude = ["image"]                     # 👈 remove the auto‑generated FK field

    @classmethod
    def get_fields(cls) -> list:
        fields = super().get_fields()
        for f in fields:
            if f.name == "image_id":
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name == "branches":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/branches/"
                f.required = False
            elif f.name == "services":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/services/"
                f.required = False
        return fields



@registry.register
class DoctorSchema(AdminSchema):
    model = Doctor
    endpoint = "/api/doctors/"
    read_serializer_class = DoctorSerializer
    write_serializer_class = DoctorSerializer
    list_display = ["id", "name", "specialization", "experience", "patients", "languages", "image_url", "is_active"]
    search_fields = ["specialization", "user__first_name", "user__last_name", "user__username", "user__email", "license_number"]
    ordering = ["-id"]
    exclude = ["image", "consultation_fee"]                     # 👈 remove auto‑generated FK & consultation_fee

    @classmethod
    def get_fields(cls) -> list:
        fields = super().get_fields()
        for f in fields:
            if f.name == "image_id":
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name == "branches":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/branches/"
                f.required = False
            elif f.name == "services":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/services/"
                f.required = False
            elif f.name == "user":
                f.filters = {"role": "doctor"}
        return fields

@registry.register
class PatientSchema(AdminSchema):
    model                  = Patient
    endpoint               = "/api/patients/"
    read_serializer_class  = PatientSerializer
    write_serializer_class = PatientSerializer
    list_display           = ["id", "name", "email", "gender", "date_of_birth", "phone_number","image_url"]
    search_fields          = ["phone_number", "user__first_name", "user__last_name", "user__username", "user__email"]
    ordering               = ["-id"]
    exclude                = ["medical_history", "user","image"]
    @classmethod
    def get_fields(cls) -> list:
            fields = super().get_fields()
            for f in fields:
                if f.name == "image_id":
                    f.type = "relation"
                    f.related_endpoint = "/api/files/"
                    f.required = False
                elif f.name == "branches":
                    f.type = "relation"
                    f.multiple = True
                    f.related_endpoint = "/api/branches/"
                    f.required = False
                elif f.name == "services":
                    f.type = "relation"
                    f.multiple = True
                    f.related_endpoint = "/api/services/"
                    f.required = False
            return fields


@registry.register
class DoctorAvailabilitySchema(AdminSchema):
    model                  = DoctorAvailability
    endpoint               = "/api/doctor-availabilities/"
    read_serializer_class  = DoctorAvailabilitySerializer
    write_serializer_class = DoctorAvailabilityWriteSerializer
    list_display           = ["id", "doctor_name", "branch_name", "weekday", "start_time", "end_time", "slot_duration_minutes"]
    search_fields          = ["doctor__user__first_name", "doctor__user__last_name", "doctor__user__username", "branch__name", "weekday"]
    ordering               = ["doctor", "weekday", "start_time"]

    @classmethod
    def get_fields(cls) -> list:
        fields = super().get_fields()
        for f in fields:
            if f.name == "doctor":
                f.type = "relation"
                f.related_endpoint = "/api/doctors/"
                f.required = True
            elif f.name == "branch":
                f.type = "relation"
                f.related_endpoint = "/api/branches/"
                f.required = True
        return fields


@registry.register
class BookingSchema(AdminSchema):
    model                  = Booking
    endpoint               = "/api/admin/bookings/"
    read_serializer_class  = BookingSerializer        
    write_serializer_class = BookingCreateSerializer  
    list_display           = ["id", "patient", "doctor", "service", "branch", "date", "status", "fee"]
    search_fields          = ["patient__user__first_name", "patient__user__last_name", "patient__user__username", "patient__phone_number", "doctor__user__first_name", "doctor__user__last_name", "doctor__user__username", "service__name", "branch__name", "status"]
    ordering               = ["-date"]
    use_explicit_viewset   = True


@registry.register
class UserSchema(AdminSchema):
    model                  = CustomUser
    endpoint               = "/api/admin-users/"
    read_serializer_class  = CustomUserSerializer
    write_serializer_class = CustomUserSerializer
    list_display           = ["id", "username", "email", "role", "is_staff", "is_active"]
    search_fields          = ["username", "email", "first_name", "last_name"]
    ordering               = ["-id"]
    filterset_fields       = ["role"]  
    exclude                = ["user_permissions", "groups"]


# client/admin_schema.py

@registry.register
class TestimonialSchema(AdminSchema):
    model                  = Testimonial
    endpoint               = "/api/testimonials/"
    read_serializer_class  = TestimonialSerializer
    write_serializer_class = TestimonialSerializer
    list_display           = ["id", "name", "rating", "is_active", "image_url", "video_file_url"]
    search_fields          = ["name", "role", "text"]
    ordering               = ["-id"]
    exclude                = ["image", "video", "name_ar", "role_ar", "text_ar"]

    @classmethod
    def get_fields(cls):
        fields = super().get_fields()
        for f in fields:
            if f.name in ("image_id", "video_id"):
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name in ("image_url", "video_file_url"):
                f.show_in_list = True
        return fields

@registry.register
class GallerySchema(AdminSchema):
    model                  = Gallery
    endpoint               = "/api/galleries/"
    read_serializer_class  = GallerySerializer
    write_serializer_class = GallerySerializer
    list_display           = ["id", "title", "category", "media_type", "is_active", "image_url", "video_file_url"]
    search_fields          = ["title", "description", "category"]
    ordering               = ["-id"]
    exclude                = ["image", "video", "title_ar", "description_ar"]

    @classmethod
    def get_fields(cls):
        fields = super().get_fields()
        for f in fields:
            if f.name in ("image_id", "video_id"):
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name in ("image_url", "video_file_url"):
                f.show_in_list = True
            elif f.name == "image_ids":
                f.type = "relation"
                f.multiple = True
                f.related_endpoint = "/api/files/"
                f.required = False
        return fields


@registry.register
class BranchGallerySchema(AdminSchema):
    model                  = BranchGallery
    endpoint               = "/api/branch-galleries/"
    read_serializer_class  = BranchGallerySerializer
    write_serializer_class = BranchGallerySerializer
    list_display           = ["id", "branch", "title", "image_url", "order", "is_active"]
    search_fields          = ["title", "description", "branch__name"]
    ordering               = ["order", "-id"]
    exclude                = ["image", "title_ar", "description_ar"]

    @classmethod
    def get_fields(cls):
        fields = super().get_fields()
        for f in fields:
            if f.name == "image_id":
                f.type = "relation"
                f.related_endpoint = "/api/files/"
                f.required = False
            elif f.name == "branch":
                f.type = "relation"
                f.related_endpoint = "/api/branches/"
                f.required = True
            elif f.name == "image_url":
                f.show_in_list = True
        return fields


@registry.register
class OfflineConversionSchema(AdminSchema):
    model                  = OfflineConversion
    endpoint               = "/api/offline-conversions/"
    list_display           = ["id", "booking", "event_name", "status", "value", "currency", "conversion_time"]
    search_fields          = ["event_name", "status", "gclid", "fbclid", "utm_source", "utm_campaign"]
    ordering               = ["-created_at"]
