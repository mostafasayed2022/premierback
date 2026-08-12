import json
import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone

from client.models import Patient, Payment, PaymentStatus, Booking, BookingStatus, Gallery, Testimonial, BranchGallery
from ..serializersfiles.placeserializers import TestimonialSerializer, BranchGallerySerializer

class PatientProfileView(APIView):
    permission_classes = [IsAuthenticated]

    # ── helpers ──────────────────────────────────────────────────────────────
    @staticmethod
    def _format_dob(dob):
        """Return ISO string from a date/str/None, never raises."""
        if not dob:
            return None
        if hasattr(dob, 'isoformat'):
            return dob.isoformat()   # real date / datetime object
        return str(dob)              # already a string (e.g. '1990-05-15')

    @staticmethod
    def _get_image_url(patient, request):
        """Return the absolute URL of the patient's profile image, or None."""
        if patient.image and patient.image.file:
            url = patient.image.file.url
            return request.build_absolute_uri(url)
        return None

    def get(self, request):
        user = request.user
        patient = get_object_or_404(Patient, user=user)

        # Calculate stats
        total_appointments = Booking.objects.filter(patient=patient).count()
        completed_visits = Booking.objects.filter(
            patient=patient,
            status=BookingStatus.COMPLETED
        ).count()

        return Response({
            "id": patient.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.get_full_name(),
            "email": user.email,
            "phone_number": patient.phone_number or "",
            "date_of_birth": self._format_dob(patient.date_of_birth),
            "gender": patient.gender or "",
            "address": "",  # not stored in DB yet
            "image_url": self._get_image_url(patient, request),
            "total_appointments": total_appointments,
            "completed_visits": completed_visits,
        })

    def patch(self, request):
        user = request.user
        patient = get_object_or_404(Patient, user=user)
        data = request.data

        # ── Update CustomUser fields ─────────────────────────────────────────
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        user.save()

        # ── Update Patient fields ──────────────────────────────────────────
        if "phone_number" in data:
            patient.phone_number = data["phone_number"]
        if "gender" in data:
            patient.gender = data["gender"] or ""
        if "date_of_birth" in data:
            dob = data["date_of_birth"]
            if dob == "" or dob is None:
                patient.date_of_birth = None
            else:
                from datetime import date as _date
                try:
                    patient.date_of_birth = _date.fromisoformat(str(dob))
                except (ValueError, TypeError):
                    patient.date_of_birth = None

        # ── Image upload (same pattern as DoctorProfileView) ─────────────────
        # Frontend uploads via POST /api/files/ → gets { id, url }.
        # Then PATCHes here with image_id=<file_id> to attach it to the patient.
        if "image_id" in data:
            image_id = data.get("image_id")
            if image_id:
                try:
                    from apps.files.models import File as FileModel
                    file_obj = FileModel.objects.get(pk=image_id)
                    patient.image = file_obj
                except FileModel.DoesNotExist:
                    pass  # ignore invalid image_id silently
            else:
                patient.image = None  # null clears the image

        patient.save()

        # ── Stats ────────────────────────────────────────────────────────
        total_appointments = Booking.objects.filter(patient=patient).count()
        completed_visits = Booking.objects.filter(
            patient=patient,
            status=BookingStatus.COMPLETED
        ).count()

        return Response({
            "id": patient.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.get_full_name(),
            "email": user.email,
            "phone_number": patient.phone_number or "",
            "date_of_birth": self._format_dob(patient.date_of_birth),
            "gender": patient.gender or "",
            "address": "",
            "image_url": self._get_image_url(patient, request),
            "total_appointments": total_appointments,
            "completed_visits": completed_visits,
        })




class PaymentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if hasattr(user, 'patient_profile'):
            payments = Payment.objects.filter(booking__patient=user.patient_profile).select_related('booking__patient__user').order_by('-created_at')
        elif hasattr(user, 'doctor_profile'):
            payments = Payment.objects.filter(booking__doctor=user.doctor_profile).select_related('booking__patient__user').order_by('-created_at')
        else:
            return Response([])

        data = []
        for p in payments:
            status_map = {
                'paid': 'Succeeded',
                'pending': 'Pending',
                'failed': 'Failed',
                'refunded': 'Failed',
            }
            status_val = status_map.get(p.status, 'Pending')
            
            data.append({
                "id": str(p.id),
                "appointmentId": str(p.booking.id),
                "customerName": p.booking.patient.user.get_full_name(),
                "amount": float(p.amount),
                "method": "Card" if p.paymob_transaction_id else "Cash",
                "date": p.created_at.strftime("%Y-%m-%d"),
                "status": status_val,
            })
        return Response(data)


class PatientRecordsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'patient_profile'):
            return Response({"detail": "User is not a patient."}, status=status.HTTP_400_BAD_REQUEST)
        
        patient = user.patient_profile
        try:
            records = json.loads(patient.medical_history)
            if not isinstance(records, list):
                records = []
        except Exception:
            records = []
            
        return Response(records)

    def post(self, request):
        user = request.user
        if not hasattr(user, 'patient_profile'):
            return Response({"detail": "User is not a patient."}, status=status.HTTP_400_BAD_REQUEST)
            
        patient = user.patient_profile
        try:
            records = json.loads(patient.medical_history)
            if not isinstance(records, list):
                records = []
        except Exception:
            records = []

        data = request.data
        
        new_record = {
            "id": f"rec-{uuid.uuid4().hex[:8]}",
            "patientId": str(patient.id),
            "title": data.get("title", "Medical Record"),
            "category": data.get("category", "Other"),
            "doctorName": data.get("doctorName", "PremierCare Doctor"),
            "date": data.get("date", timezone.localdate().isoformat()),
            "fileUrl": data.get("fileUrl", ""),
            "fileSize": data.get("fileSize", "Unknown size"),
            "notes": data.get("notes", ""),
        }
        
        records.insert(0, new_record)
        patient.medical_history = json.dumps(records)
        patient.save()
        
        return Response(new_record, status=status.HTTP_201_CREATED)


class GalleryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            galleries = Gallery.objects.filter(is_active=True).select_related('image', 'video').prefetch_related('images__file')
            data = []
            for g in galleries:
                img_url = ""
                image_obj = getattr(g, 'image', None)
                if image_obj and hasattr(image_obj, 'file') and image_obj.file:
                    url = image_obj.file.url
                    img_url = request.build_absolute_uri(url) if request else url
                else:
                    first_img = g.images.first()
                    if first_img and first_img.file:
                        url = first_img.file.file.url
                        img_url = request.build_absolute_uri(url) if request else url

                video_obj = getattr(g, 'video', None)
                video_file_url = None
                if video_obj and hasattr(video_obj, 'file') and video_obj.file:
                    url = video_obj.file.url
                    video_file_url = request.build_absolute_uri(url) if request else url

                images_list = []
                for gi in g.images.all():
                    if gi.file:
                        url = gi.file.file.url
                        images_list.append(request.build_absolute_uri(url) if request else url)

                data.append({
                    "id": g.id,
                    "title": g.title,
                    "title_ar": getattr(g, 'title_ar', None) or g.title,
                    "category": g.category,
                    "media_type": getattr(g, 'media_type', 'image'),
                    "image_url": img_url,
                    "video_file_url": video_file_url,
                    "video_url": getattr(g, 'video_url', None),
                    "images": images_list,
                    "description": g.description,
                    "description_ar": getattr(g, 'description_ar', None) or g.description,
                })
            return Response(data)
        except Exception:
            galleries = Gallery.objects.filter(is_active=True).prefetch_related('images__file')
            data = []
            for g in galleries:
                first_img = g.images.first()
                img_url = ""
                if first_img and first_img.file:
                    url = first_img.file.file.url
                    img_url = request.build_absolute_uri(url) if request else url

                data.append({
                    "id": g.id,
                    "title": g.title,
                    "title_ar": getattr(g, 'title_ar', None) or g.title,
                    "category": g.category,
                    "media_type": "image",
                    "image_url": img_url,
                    "video_file_url": None,
                    "video_url": None,
                    "images": [],
                    "description": g.description,
                    "description_ar": getattr(g, 'description_ar', None) or g.description,
                })
            return Response(data)


class TestimonialListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            testimonials = Testimonial.objects.filter(is_active=True).select_related('image', 'video')
            serializer = TestimonialSerializer(testimonials, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception:
            return Response([])


class BranchGalleryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            branch_id = request.query_params.get("branch_id")
            qs = BranchGallery.objects.filter(is_active=True).select_related('image', 'branch')
            if branch_id and branch_id != "all":
                qs = qs.filter(branch_id=branch_id)

            serializer = BranchGallerySerializer(qs, many=True, context={'request': request})
            data = []
            for item in serializer.data:
                # ensure image field is set to image_url if image missing
                img = item.get("image_url") or ""
                item["image"] = img
                data.append(item)

            return Response(data)
        except Exception:
            return Response([])

