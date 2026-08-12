# client/urls.py — PremierCare API URL configuration
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import *

# ─── Admin router ─────────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")


# ─── URL patterns ─────────────────────────────────────────────────────────────
urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("token/",         RoleTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(),        name="token_refresh"),
    path("auth/register/", RegisterView.as_view(),            name="auth-register"),

    #------------------ reset passsword----------------
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', VerifyOTPView.as_view(), name='password-reset-verify'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    # ── Patient Bookings ──────────────────────────────────────────────────────
    path("bookings/create/", CreateBookingView.as_view(), name="booking-create"),
    path("bookings/guest/",  GuestBookingLookupView.as_view(), name="booking-guest-lookup"),
    path("bookings/mine/",   MyBookingsView.as_view(),   name="booking-mine"),

    # ── Payments ──────────────────────────────────────────────────────────────
    path("payments/webhook/", PaymobWebhookView.as_view(), name="paymob-webhook"),
    path("payments/callback/", PaymobCallbackView.as_view(), name="paymob-callback"),
    path("bookings/<uuid:pk>/status/", BookingStatusView.as_view(), name="booking-status"),

    # ── Admin Stats ───────────────────────────────────────────────────────────
    path("admin/stats/",     AdminStatsView.as_view(),   name="admin-stats"),

    # ──  Booking Wizard ─────────────────────────────────────────────────
    # Step 1 — list all active departments
    path("wizard/departments/",                                  DepartmentStepView.as_view(),   name="wizard-departments"),
    # path("branches/",     BranchListView.as_view(),      name="branch"),

    # Step 2 — services available in a given department
    path("wizard/departments/<int:department_id>/services/",     ServiceStepView.as_view(),      name="wizard-services"),

    # Step 3 — branches offering a specific service (with per-branch pricing)
    path("wizard/services/<int:service_id>/branches/",           BranchStepView.as_view(),       name="wizard-branches"),

    # Step 4 — doctors available at a branch (optionally filtered by service)
    path("wizard/branches/<int:branch_id>/doctors/",             DoctorstepView.as_view(),       name="wizard-doctors"),

    # Step 5 — available time slots for a doctor at a branch
    path("wizard/doctors/<int:doctor_id>/slots/",                AvailableSlotsView.as_view(),   name="wizard-slots"),

    path("departments/<int:id>/departments/",                                  DepartmentListView.as_view(),   name="departments"),

    # path("",doctor,name="doctor"),
    
    # Branches page 
    path("wizard/branches/",                                       BranchListView.as_view(),       name="branches"),

    
    path("wizard/doctors/",                                                 DoctorListView.as_view() ,     name="doctors"),
    path("doctors/<int:id>/doctors/" ,                                       DoctorDetailView.as_view() ,   name= "doctor-details"),


    # Services page
    path("wizard/services/",                                                      ServiceListView.as_view() ,     name="services"),

    # # Step 2 — services available in a given department
    path("services/<int:id>/services/",     ServiceDetailView.as_view(),      name="service-detail"),


    path("profile/doctor/",                          DoctorProfileView.as_view() ,    name="doctor-profile"),
    path("profile/patient/",                         PatientProfileView.as_view() ,   name="patient-profile"),
    path("doctor/bookings/<uuid:booking_id>/",       DoctorBookingRescheduleView.as_view(),  name = "doctor-booking-reschedule"),

    path("payments/",                                PaymentListView.as_view(),       name="payments-list"),
    path("patient/records/",                         PatientRecordsView.as_view(),    name="patient-records"),
    path("gallery/",                                 GalleryListView.as_view(),       name="gallery-list"),
    path("branch-galleries-public/",                 BranchGalleryListView.as_view(), name="branch-gallery-public-list"),
    path("testimonials-public/",                      TestimonialListView.as_view(),   name="testimonial-public-list"),

] + router.urls