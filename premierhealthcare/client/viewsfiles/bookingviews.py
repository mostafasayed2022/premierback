
from client.serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.throttling import AnonRateThrottle
from client.services import PaymobService
from client.tasks import send_booking_confirmation_task




class CreateBookingView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    @transaction.atomic
    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        doctor = serializer.validated_data['doctor']
        service = serializer.validated_data['service']
        branch = serializer.validated_data['branch']
        payment_method = request.data.get("payment_method", "paymob")

        VALID_PAYMENT_METHODS = {"cash", "card", "insurance", "paymob"}
        if payment_method not in VALID_PAYMENT_METHODS:
            return Response({"detail": f"Invalid payment_method: {payment_method}"},
                            status=status.HTTP_400_BAD_REQUEST)

        # ── Resolve patient (authenticated or guest) ────────────────────
        if request.user and request.user.is_authenticated:
            if not hasattr(request.user, 'patient_profile'):
                return Response({"detail": "User is not a patient."},
                                status=status.HTTP_400_BAD_REQUEST)
            patient = request.user.patient_profile
            patient_user = request.user
        else:
            email = request.data.get("email")
            phone = request.data.get("phone")
            if not email or not phone:
                return Response({"detail": "Email and phone are required for guest booking."},
                                status=status.HTTP_400_BAD_REQUEST)

            existing_user = CustomUser.objects.filter(email=email).first()
            if existing_user:
                if not hasattr(existing_user, 'patient_profile'):
                    return Response(
                        {"detail": "This email is registered under a non-patient account."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                patient = existing_user.patient_profile
                patient_user = existing_user
                if phone and patient.phone_number != phone:
                    patient.phone_number = phone
                    patient.save(update_fields=["phone_number"])
            else:
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while CustomUser.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                guest_user = CustomUser.objects.create(
                    username=username,
                    email=email,
                    role=Role.PATIENT,
                    is_verified=True,
                )
                guest_user.set_unusable_password()
                guest_user.save()
                patient = Patient.objects.create(user=guest_user, phone_number=phone)
                patient_user = guest_user

        # ── Slot conflict check ─────────────────────────────────────────
        conflict = Booking.objects.select_for_update().filter(
            doctor=doctor,
            date=serializer.validated_data['date'],
            start_time=serializer.validated_data['start_time'],
            status__in=['pending_payment', 'confirmed'],
        ).exists()
        if conflict:
            return Response({"detail": "Slot already booked."},
                            status=status.HTTP_409_CONFLICT)

        # ── Create booking (fee resolved to service default fee) ─────────
        booking = serializer.save(patient=patient, fee=service.default_fee)

        # ── Payment processing ───────────────────────────────────────────
        if payment_method in ["cash", "card", "insurance"]:
            booking.status = BookingStatus.CONFIRMED
            booking.save()
            Payment.objects.create(
                booking=booking,
                amount=booking.fee,
                status=PaymentStatus.PENDING,
            )
            # Send confirmation email 
            send_booking_confirmation_task.delay(booking.id)

            return Response({
                "booking": BookingSerializer(booking).data,
                "payment_url": "",
            }, status=status.HTTP_201_CREATED)

        else:  # paymob
            paymob = PaymobService()
            try:
                result = paymob.init_payment(booking, patient_user)
            except Exception as e:
                booking.delete()
                return Response({"detail": f"Payment init failed: {str(e)}"},
                                status=status.HTTP_502_BAD_GATEWAY)

            Payment.objects.create(
                booking=booking,
                amount=booking.fee,
                paymob_order_id=result['order_id'],
                payment_token=result['payment_token'],
            )
            # Email will be sent after Paymob confirmation (in webhook handler)
            return Response({
                "booking": BookingSerializer(booking).data,
                "payment_url": result['iframe_url'],
            }, status=status.HTTP_201_CREATED)
class BookingStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        booking = get_object_or_404(Booking, id=pk)

        # A booking may not have a payment yet, so use filter().first()
        payment = Payment.objects.filter(booking=booking).first()
        payment_status = payment.status if payment else None

        return Response({
            "id": str(booking.id),
            "status": booking.status,
            "payment_status": payment_status,
        }, status=status.HTTP_200_OK)

class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Booking.objects.filter(patient=user.patient_profile).order_by('-date')
        elif user.role == 'doctor':
            return Booking.objects.filter(doctor=user.doctor_profile).order_by('-date')
        return Booking.objects.none()