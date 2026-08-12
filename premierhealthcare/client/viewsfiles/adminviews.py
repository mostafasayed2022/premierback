

from django.db.migrations import serializer
from django.db.models import OuterRef, Subquery, DecimalField
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from client.serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from client.permissions import  IsAdmin
from core.viewsets import AdminModelViewSet




class AdminTokenObtainPairView(TokenObtainPairView):
    """Login endpoint — returns access + refresh + user profile."""
    serializer_class = AdminTokenObtainPairSerializer




class AdminLogoutView(APIView):
    """
    Blacklists the refresh token on logout.
    Requires: { "refresh": "<token>" } in body.
    """
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)





class AdminUserViewSet(AdminModelViewSet):
    """
    CRUD for admin user management.
    Only superusers can manage other users.
    """
    queryset = CustomUser.objects.filter(is_staff=True).order_by("-id")
    serializer_class = AdminUserSerializer
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["id", "username"]

    def get_permissions(self):
        # Creating/deleting users requires superuser
        from rest_framework.permissions import IsAdminUser
        from core.permissions import IsSuperUser
        if self.action in ("create", "destroy"):
            return [IsSuperUser()]
        return [IsAdminUser()]

    
class AdminStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models import Count, Sum
        from datetime import timedelta
        from client.models import Doctor, Patient, Department, Service, Branch, DoctorAvailability

        thirty_days_ago = timezone.now().date() - timedelta(days=30)

        # ── Analytics Cards Counts ────────────────────────────────────────────
        total_bookings        = Booking.objects.count()
        bookings_this_month   = Booking.objects.filter(date__gte=thirty_days_ago).count()
        total_patients        = Patient.objects.count()
        total_doctors         = Doctor.objects.count()
        total_departments     = Department.objects.count()
        total_services        = Service.objects.count()
        total_branches        = Branch.objects.count()
        total_staff           = CustomUser.objects.filter(is_staff=True).count()
        total_availability    = DoctorAvailability.objects.count()
        active_bookings       = Booking.objects.filter(status__in=['pending_payment', 'confirmed']).count()
        completed_bookings    = Booking.objects.filter(status='completed').count()
        cancelled_bookings    = Booking.objects.filter(status__in=['cancelled', 'expired']).count()

        # ── Revenue ───────────────────────────────────────────────────────────
        total_revenue = Payment.objects.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0

        # ── Charts: Daily bookings (last 30 days) ─────────────────────────────
        daily_bookings = (
            Booking.objects.filter(date__gte=thirty_days_ago)
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        daily_stats = []
        for entry in daily_bookings:
            d = entry['date']
            date_str = d.strftime("%Y-%m-%d") if hasattr(d, 'strftime') else str(d)
            daily_stats.append({"date": date_str, "count": entry['count']})

        # ── Charts: Bookings per branch ───────────────────────────────────────
        branch_bookings = (
            Booking.objects.values('branch__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        branch_stats = [
            {"branch": entry['branch__name'] or "Unknown", "count": entry['count']}
            for entry in branch_bookings
        ]

        # ── Charts: Bookings per doctor ───────────────────────────────────────
        doctor_bookings = (
            Booking.objects.values('doctor__user__first_name', 'doctor__user__last_name', 'doctor__user__username')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        doctor_stats = []
        for entry in doctor_bookings:
            name = f"{entry['doctor__user__first_name']} {entry['doctor__user__last_name']}".strip()
            name = name or entry['doctor__user__username']
            doctor_stats.append({"doctor": name, "count": entry['count']})

        # ── Charts: Payment distribution ──────────────────────────────────────
        payment_distribution = (
            Payment.objects.values('status')
            .annotate(count=Count('id'))
        )
        payment_stats = [
            {"status": entry['status'], "count": entry['count']}
            for entry in payment_distribution
        ]

        return Response({
            # ── Analytics Cards ──────────────────────────────────────────────
            "analytics": {
                "total_bookings":      total_bookings,
                "bookings_this_month": bookings_this_month,
                "active_bookings":     active_bookings,
                "completed_bookings":  completed_bookings,
                "cancelled_bookings":  cancelled_bookings,
                "total_patients":      total_patients,
                "total_doctors":       total_doctors,
                "total_departments":   total_departments,
                "total_services":      total_services,
                "total_branches":      total_branches,
                "total_staff":         total_staff,
                "total_availability":  total_availability,
                "total_revenue":       float(total_revenue),
            },
            # ── Charts ───────────────────────────────────────────────────────
            "daily_bookings":  daily_stats,
            "branch_bookings": branch_stats,
            "doctor_bookings": doctor_stats,
            "payment_stats":   payment_stats,
        })    


