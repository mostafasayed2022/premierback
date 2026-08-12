from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from client.serializers import *
from client.services import PaymobService
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import  AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.http import HttpResponseRedirect





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

        if success :
            payment.status = PaymentStatus.PAID
            payment.paid_at = timezone.now()
            booking.status = BookingStatus.CONFIRMED
            payment.save()
            booking.save()
            
        elif not success and not pending:
            payment.status = PaymentStatus.FAILED
            booking.status = BookingStatus.CANCELLED
            payment.save()
            booking.save()
            
        else:
            payment.save()

        return Response(status=status.HTTP_200_OK)


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
