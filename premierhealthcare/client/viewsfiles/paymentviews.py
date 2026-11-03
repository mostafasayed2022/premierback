from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from client.serializers import *
from client.services import PaymobService
from client.cybersource_service import CyberSourceService, CyberSourceError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.http import HttpResponseRedirect





from client.models import OfflineConversion


def handle_successful_payment(booking, transaction_id=None):
    """Create idempotent purchase OfflineConversion."""
    def create_purchase_conversion():
        OfflineConversion.objects.get_or_create(
            booking=booking,
            event_name=OfflineConversion.EventName.PURCHASE,
            defaults={
                "value": booking.fee,
                "currency": "EGP",
                "utm_source": booking.utm_source,
                "utm_campaign": booking.utm_campaign,
                "gclid": booking.gclid,
                "fbclid": booking.fbclid,
                "ttclid": booking.ttclid,
                "sc_click_id": booking.sc_click_id,
                "payload": {
                    "booking_id": str(booking.pk),
                    "transaction_id": transaction_id or getattr(booking, "payment_transaction_id", None),
                    "service_id": getattr(booking.service, "id", None),
                },
            },
        )
    transaction.on_commit(create_purchase_conversion)


@method_decorator(csrf_exempt, name='dispatch')
class PaymobWebhookView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        hmac_received = request.query_params.get("hmac")
        if not hmac_received:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        paymob = PaymobService()
        if not paymob.verify_hmac(request.data, hmac_received):
            return Response({"detail": "Invalid HMAC"}, status=status.HTTP_403_FORBIDDEN)

        obj = request.data.get("obj", request.data)
        merchant_order_id = obj.get("order", {}).get("merchant_order_id")
        success = obj.get("success")
        pending = obj.get("pending", False)
        transaction_id = obj.get("id")

        if not merchant_order_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        booking = get_object_or_404(
            Booking.objects.select_related("patient__user", "doctor__user"),
            id=merchant_order_id,
        )
        payment = get_object_or_404(Payment, booking=booking)

        # Idempotency check:
        if payment.status in [PaymentStatus.PAID, PaymentStatus.FAILED]:
            return Response(status=status.HTTP_200_OK)

        payment.raw_webhook_payload = request.data
        payment.paymob_transaction_id = transaction_id

        if success:
            payment.status = PaymentStatus.PAID
            payment.paid_at = timezone.now()
            booking.status = BookingStatus.CONFIRMED
            payment.save()
            booking.save()
            handle_successful_payment(booking, transaction_id=transaction_id)

        elif not success and not pending:
            payment.status = PaymentStatus.FAILED
            booking.status = BookingStatus.CANCELLED
            payment.save()
            booking.save()

        else:
            payment.save()

        return Response(status=status.HTTP_200_OK)


class CyberSourceConfirmView(APIView):
    """Verify a signed Unified Checkout result before confirming a booking."""
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    @transaction.atomic
    def post(self, request):
        booking_id = request.data.get("booking_id")
        result_jwt = request.data.get("result")

        if not booking_id or not isinstance(result_jwt, str):
            return Response(
                {"detail": "booking_id and signed checkout result are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(result_jwt) > 50000:
            return Response(
                {"detail": "Checkout result is too large."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = get_object_or_404(
            Booking.objects.select_for_update(),
            id=booking_id,
        )
        payment = get_object_or_404(
            Payment.objects.select_for_update(),
            booking=booking,
        )

        # Idempotent success: a second browser submission cannot repeat side effects.
        if payment.status == PaymentStatus.PAID:
            return Response({
                "booking_id": str(booking.pk),
                "payment_status": "paid",
                "status": booking.status,
                "transaction_id": payment.cybersource_transaction_id,
                "amount": str(payment.amount),
                "currency": payment.currency,
            })

        if payment.status == PaymentStatus.FAILED:
            return Response({
                "booking_id": str(booking.pk),
                "payment_status": "failed",
                "status": booking.status,
            })

        try:
            result = CyberSourceService().verify_completed_result(
                result_jwt=result_jwt,
                booking=booking,
                payment=payment,
            )
        except CyberSourceError as exc:
            # A public-key lookup/network problem is a gateway error. A signature,
            # amount, currency, or booking mismatch is an invalid client result.
            response_status = (
                status.HTTP_502_BAD_GATEWAY
                if getattr(exc, "status_code", None)
                else status.HTTP_400_BAD_REQUEST
            )
            return Response(
                {"detail": "CyberSource payment result could not be verified."},
                status=response_status,
            )

        payment.cybersource_transaction_id = result["transaction_id"]
        if result["state"] == "pending":
            payment.save(update_fields=["cybersource_transaction_id"])
            return Response(
                {
                    "booking_id": str(booking.pk),
                    "payment_status": "pending",
                    "status": booking.status,
                    "transaction_id": result["transaction_id"],
                },
                status=status.HTTP_202_ACCEPTED,
            )

        if result["state"] == "failed":
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=["status", "cybersource_transaction_id"])
            booking.status = BookingStatus.CANCELLED
            booking.save(update_fields=["status"])
            return Response({
                "booking_id": str(booking.pk),
                "payment_status": "failed",
                "status": booking.status,
                "transaction_id": result["transaction_id"],
            })

        payment.status = PaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save(update_fields=[
            "status",
            "paid_at",
            "cybersource_transaction_id",
        ])
        booking.status = BookingStatus.CONFIRMED
        booking.save(update_fields=["status"])

        # Existing helper schedules the idempotent purchase conversion on commit.
        handle_successful_payment(
            booking,
            transaction_id=result["transaction_id"],
        )

        return Response({
            "booking_id": str(booking.pk),
            "payment_status": "paid",
            "status": booking.status,
            "transaction_id": result["transaction_id"],
            "amount": str(payment.amount),
            "currency": payment.currency,
        }, status=status.HTTP_200_OK)


class PaymobCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        merchant_order_id = request.query_params.get("merchant_order_id")
        paymob_order_id = request.query_params.get("order")

        booking = None
        if merchant_order_id:
            try:
                booking = Booking.objects.filter(id=merchant_order_id).first()
            except Exception:
                pass
        if not booking and paymob_order_id:
            payment = Payment.objects.filter(paymob_order_id=paymob_order_id).first()
            if payment:
                booking = payment.booking

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        booking_id_str = str(booking.id) if booking else ""

        if not booking:
            redirect_url = f"{frontend_url}/book-appointment?payment_status=error"
        elif booking.status == BookingStatus.CONFIRMED:
            redirect_url = f"{frontend_url}/book-appointment?payment_status=success&booking_id={booking_id_str}"
        elif booking.status == BookingStatus.CANCELLED:
            redirect_url = f"{frontend_url}/book-appointment?payment_status=failed&booking_id={booking_id_str}"
        else:
            # Race condition: Webhook hasn't updated booking status yet
            redirect_url = f"{frontend_url}/book-appointment?payment_status=processing&booking_id={booking_id_str}"

        return HttpResponseRedirect(redirect_url)
