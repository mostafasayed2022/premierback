
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .tasks import send_booking_rescheduled_notification_task
from django.db import transaction, IntegrityError
from rest_framework.permissions import  AllowAny
from .permissions import IsDoctor
from django.shortcuts import get_object_or_404
from rest_framework.throttling import AnonRateThrottle
from .viewsfiles.adminviews import *
from .viewsfiles.bookingviews import *
from .viewsfiles.paymentviews import *
from .viewsfiles.stepsviews import *
from .viewsfiles.profileviews import *
from .otp import send_otp_email
from django.db.models import Q


class DoctorDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        # Use get_object_or_404 to return 404 if not found or inactive
        doctor = get_object_or_404(Doctor, id=id)
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data)
class DepartmentListView(APIView):
    """ GET /api/departments/"""
    permission_classes = [AllowAny]

    def get(self, request,id):
        departments = Department.objects.filter(id=id,is_active=True)
        return Response(DepartmentSerializer(departments,many=True).data)


class BranchListView(APIView):
    permission_classes = [AllowAny,]

    def get(self,request):
        
            branches = Branch.objects.all()
            serializer  =BranchSerializer(branches , many=True)

            return Response(serializer.data , status = status.HTTP_200_OK)



 # use a public serializer

class DoctorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Doctor.objects.select_related('user').prefetch_related('services__department', 'branches')

        # ── Text search (name / specialization) ────────────────────────
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(specialization__icontains=search)
            )

        # ── Filter by department (through services) ────────────────────
        department = request.query_params.get('department', '').strip()
        if department:
            # department slug or name? Assuming slug for frontend
            queryset = queryset.filter(services__department__slug=department).distinct()

        # ── Filter by branch (through M2M) ────────────────────────────
        branch = request.query_params.get('branch', '').strip()
        if branch:
            # branch slug or name? Adjust if needed
            queryset = queryset.filter(branches__slug=branch).distinct()   # if branch has slug, else use name

        serializer = DoctorPublicSerializer(queryset, many=True)
        return Response(serializer.data)

class ServiceListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        services = Service.objects.all()
        serializer = ServicepublicSerializer(services, many=True)

        return Response(serializer.data)


class ServiceDetailView(APIView):

    permission_classes = [AllowAny]
    def get(self, request, id):
        services = Service.objects.filter(id =id ,is_active = True)
        return Response(ServicepublicSerializer(services,many=True).data)
        



class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response(
            {
                "detail": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


    

class RoleTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleTokenObtainPairSerializer


class GuestBookingLookupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        booking_reference = request.data.get("booking_reference")

        if not email or not booking_reference:
            return Response({"detail": "Both email and booking_reference are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = get_object_or_404(
                Booking.objects.select_related("patient__user", "doctor__user", "service", "branch"),
                id=booking_reference,
                patient__user__email=email
            )
            return Response(BookingSerializer(booking).data)
        except Exception:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)



class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]  # AllowAny

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email__iexact=email)
        otp = PasswordResetOTP.generate_for_user(user)
        send_otp_email(user, otp.code)
        return Response({"detail": "OTP sent to your email."}, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        try:
            user = CustomUser.objects.get(email__iexact=email)
            otp = PasswordResetOTP.objects.filter(user=user, code=code, is_used=False).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.is_valid():
            return Response({"detail": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "OTP is valid."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']
        try:
            user = CustomUser.objects.get(email__iexact=email)
            otp = PasswordResetOTP.objects.filter(user=user, code=code, is_used=False).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.is_valid():
            return Response({"detail": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
        # All good – set the new password
        user.set_password(new_password)
        user.save()
        otp.is_used = True
        otp.save()
        return Response({"detail": "Password reset successfully."}, status=status.HTTP_200_OK)



# class DoctorProfileView(APIView):
#     permission_classes = [IsDoctor]

#     def get_doctor(self, request):
#         return get_object_or_404(Doctor, user=request.user)

#     def get(self, request):
#         doctor = self.get_doctor(request)
#         serializer = DoctorProfileDetailSerializer(doctor, context={'request': request})
#         data = serializer.data

#         # Optionally add bookings (keep using existing BookingSerializer)
#         bookings = Booking.objects.filter(doctor=doctor)\
#             .select_related('patient__user', 'service', 'branch')\
#             .order_by('-date', '-start_time')
#         data['bookings'] = BookingSerializer(bookings, many=True).data

#         return Response(data, status=status.HTTP_200_OK)





class DoctorProfileView(APIView):
    permission_classes = [IsDoctor]

    def get_doctor(self, request):
        return get_object_or_404(Doctor, user=request.user)

    def get(self, request):
        doctor = self.get_doctor(request)

        bookings = (
            Booking.objects
            .filter(doctor=doctor, status=BookingStatus.CONFIRMED)
            .select_related("patient__user", "service", "branch")
            .order_by("date", "start_time")
        )

        data = DoctorProfileDetailSerializer(doctor, context={'request': request}).data
        data["bookings"] = DoctorProfileBookingSerializer(bookings, many=True).data
        return Response(data)

    @transaction.atomic
    def patch(self, request):
        doctor = self.get_doctor(request)
        data = request.data

        # ── Update CustomUser fields ───────────────────────────────────────────
        user = doctor.user
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        user.save()

        # ── Update Doctor text fields ──────────────────────────────────────────
        if 'specialization' in data:
            doctor.specialization = data['specialization']
        elif 'specialty' in data:
            doctor.specialization = data['specialty']
        if 'position' in data:
            doctor.position = data['position']
        if 'license_number' in data:
            doctor.license_number = data['license_number']
        elif 'licenseNumber' in data:
            doctor.license_number = data['licenseNumber']
        if 'consultation_fee' in data:
            doctor.consultation_fee = data['consultation_fee'] or None
        elif 'consultationFee' in data:
            doctor.consultation_fee = data['consultationFee'] or None
        if 'bio' in data:
            doctor.bio = data['bio']

        # ── Image upload (same pattern as PatientProfileView) ──────────────────
        # Frontend uploads a file via POST /api/files/ → gets { id, url }.
        # It then PATCHes here with image_id=<file_id> to attach to the doctor.
        if 'image_id' in data:
            image_id = data.get('image_id')
            if image_id:
                try:
                    from apps.files.models import File as FileModel
                    file_obj = FileModel.objects.get(pk=image_id)
                    doctor.image = file_obj
                except FileModel.DoesNotExist:
                    pass  # ignore invalid image_id silently
            else:
                # Allow unsetting the image by passing image_id=null
                doctor.image = None

        # ── Handle availabilities update ───────────────────────────────────────
        if 'availabilities_data' in data:
            # Clear existing availabilities
            doctor.availabilities.all().delete()
            
            # Create new ones
            avail_list = data['availabilities_data']
            for item in avail_list:
                # Resolve branch from branch_id or branch_name
                branch_id = item.get('branch_id') or item.get('branchId')
                branch_name = item.get('branch_name') or item.get('branchName')
                branch = None
                if branch_id:
                    branch = Branch.objects.filter(pk=branch_id).first()
                if not branch and branch_name:
                    branch = Branch.objects.filter(name=branch_name).first()
                if not branch:
                    branch = doctor.branches.first() or Branch.objects.filter(is_active=True).first()
                
                if not branch:
                    continue
                
                # Auto-link branch to doctor M2M relation
                doctor.branches.add(branch)
                
                # Map weekday shortname display mapping to match Choices (e.g. 'Mon' -> 'monday', 'Monday' -> 'monday')
                weekday_raw = item.get('weekday', 'monday').lower()
                # Find matching weekday choice value
                choices_map = {
                    'mon': 'monday', 'monday': 'monday',
                    'tue': 'tuesday', 'tuesday': 'tuesday',
                    'wed': 'wednesday', 'wednesday': 'wednesday',
                    'thu': 'thursday', 'thursday': 'thursday',
                    'fri': 'friday', 'friday': 'friday',
                    'sat': 'saturday', 'saturday': 'saturday',
                    'sun': 'sunday', 'sunday': 'sunday',
                }
                weekday_choice = choices_map.get(weekday_raw[:3], 'monday')

                start_time = item.get('start_time') or item.get('startTime')
                end_time = item.get('end_time') or item.get('endTime')
                slot_duration = item.get('slot_duration_minutes') or item.get('slotDurationMinutes') or 30

                if not start_time or not end_time:
                    continue

                DoctorAvailability.objects.create(
                    doctor=doctor,
                    branch=branch,
                    weekday=weekday_choice,
                    start_time=start_time,
                    end_time=end_time,
                    slot_duration_minutes=slot_duration
                )

        doctor.save()

        # ── Return fresh profile data (same shape as GET) ──────────────────────
        bookings = (
            Booking.objects
            .filter(doctor=doctor, status=BookingStatus.CONFIRMED)
            .select_related("patient__user", "service", "branch")
            .order_by("date", "start_time")
        )

        resp_data = DoctorProfileDetailSerializer(doctor, context={'request': request}).data
        resp_data["bookings"] = DoctorProfileBookingSerializer(bookings, many=True).data
        return Response(resp_data, status=status.HTTP_200_OK)



class DoctorBookingRescheduleView(APIView):
    """
    PATCH /doctor/bookings/<uuid:booking_id>/
    Lets the logged-in doctor change the date/time of one of their own bookings.
    Booking status is never touched — the appointment stays CONFIRMED/paid,
    only its schedule changes, and the patient is notified.
    """
    permission_classes = [IsDoctor]

    @transaction.atomic
    def patch(self, request, booking_id):
        doctor = get_object_or_404(Doctor, user=request.user)

        booking = get_object_or_404(
            Booking.objects.select_related("patient__user", "branch"),
            id=booking_id,
            doctor=doctor,          # doctor can only touch their OWN bookings
        )

        if booking.status != BookingStatus.CONFIRMED:
            return Response(
                {"detail": "Only confirmed bookings can be rescheduled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_date, old_start, old_end = booking.date, booking.start_time, booking.end_time

        serializer = DoctorProfileBookingUpdateSerializer(
            booking, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save()  # only date/start_time/end_time change
        except IntegrityError:
            return Response(
                {"detail": "This doctor already has an active booking at that date/time."},
                status=status.HTTP_409_CONFLICT,
            )

        changed = (
            booking.date != old_date
            or booking.start_time != old_start
            or booking.end_time != old_end
        )

        if changed:
            transaction.on_commit(
                lambda: send_booking_rescheduled_notification_task.delay(
                    str(booking.id),
                    doctor.user.get_full_name(),
                    old_date.isoformat(),
                    old_start.strftime("%H:%M"),
                )
            )

        return Response(DoctorProfileBookingSerializer(booking).data, status=status.HTTP_200_OK)