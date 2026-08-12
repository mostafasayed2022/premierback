
from django.db.models import OuterRef, Subquery, DecimalField
from client.serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from datetime import datetime, timedelta,date




class DepartmentStepView(APIView):
    """Step 1: GET /api/wizard/departments/"""
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.filter(is_active=True)
        return Response(DepartmentSerializer(departments, many=True).data)


class ServiceStepView(APIView):
    """Step 2: GET /api/wizard/departments/<department_id>/services/"""
    permission_classes = [AllowAny]

    def get(self, request, department_id):
        services = Service.objects.filter(department_id=department_id, is_active=True)
        return Response(ServiceSerializer(services, many=True).data)


class BranchListView(APIView):
    """Step 3: GET /api/wizard/services/<service_id>/branches/"""
    permission_classes = [AllowAny]

    def get(self, request):
        branches = Branch.objects.filter( is_active=True).distinct()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data)
    def post(self, request):
        service_id = request.data.get("service_id")
        if not service_id:
            return Response(...)
        branches = Branch.objects.filter(services=service_id, is_active=True).distinct()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data)


class BranchStepView(APIView):
    """Step 3: GET /api/wizard/services/<service_id>/branches/"""
    permission_classes = [AllowAny]

    def get(self, request, service_id):
        branches = Branch.objects.filter(services=service_id, is_active=True).distinct()
        serializer = BranchSerializer(branches, many=True, context={"service": service_id})
        return Response(serializer.data)


class DoctorstepView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, branch_id: int):
        service_id = request.query_params.get("service")
        
        if not service_id:
            return Response(
                {"detail": "service query param is required."}, status=400
            )
        doctors = (
            Doctor.objects
            # ── AND filter: must be at this branch AND offer this service ──
            .filter(branches__id=branch_id, services__id=service_id)
            .distinct()
            .select_related("user")               
            .annotate(
  
            )
        )
        serializer = DoctorSerializer(
            doctors, many=True,
            context={"service": service_id, "branch_id": branch_id},
        )
        return Response(serializer.data)

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, doctor_id):
        branch_id = request.query_params.get("branch")
        if not branch_id:
            return Response({"detail": "branch is required."}, status=400)

        today = date.today()
        start_str = request.query_params.get("start_date", today.isoformat())
        end_str   = request.query_params.get("end_date", (today + timedelta(days=30)).isoformat())
        try:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
            end_date   = datetime.strptime(end_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "date must be YYYY-MM-DD."}, status=400)

        all_slots = []
        current_date = start_date
        while current_date <= end_date:
            day_name = current_date.strftime("%A").lower()  # FIX: match lowercase model values
            availabilities = DoctorAvailability.objects.filter(
                doctor_id=doctor_id, branch_id=branch_id, weekday=day_name
            )
            if availabilities.exists():
                bookings = Booking.objects.filter(
                    doctor_id=doctor_id, branch_id=branch_id, date=current_date,
                    status__in=["pending_payment", "confirmed"],
                ).only("start_time", "service__duration_minutes")

                occupied_starts = set()
                for b in bookings:
                    b_start = b.start_time
                    duration = b.service.duration_minutes
                    b_end = (datetime.combine(current_date, b_start) + timedelta(minutes=duration)).time()
                    for avail in availabilities:
                        step = timedelta(minutes=avail.slot_duration_minutes)
                        cursor = datetime.combine(current_date, b_start)
                        end_dt = datetime.combine(current_date, b_end)
                        while cursor < end_dt:
                            occupied_starts.add(cursor.time())
                            cursor += step

                for avail in availabilities:
                    start_t = avail.start_time
                    end_t   = avail.end_time
                    step = timedelta(minutes=avail.slot_duration_minutes)

                    cursor = datetime.combine(current_date, start_t)
                    end_dt = datetime.combine(current_date, end_t)

                    while cursor + step <= end_dt:
                        slot_time = cursor.time()
                        if slot_time not in occupied_starts:
                            all_slots.append({
                                "date": current_date,
                                "start_time": slot_time,
                                "end_time": (cursor + step).time(),
                            })
                        cursor += step

            current_date += timedelta(days=1)
        serializer = AvailableSlotSerializer(all_slots, many=True)
        return Response(serializer.data)
