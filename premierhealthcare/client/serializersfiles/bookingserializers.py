from client.models import Booking , BookingStatus ,Doctor,DoctorAvailability
from datetime import datetime, timedelta
from django.utils import timezone  
from rest_framework import serializers

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["doctor", "service", "branch", "date", "start_time", "end_time", "fee"]
        read_only_fields = ["end_time", "fee"]

    def validate(self, attrs):
        doctor = attrs["doctor"]
        service = attrs["service"]
        branch = attrs["branch"]
        date = attrs["date"]
        start_time = attrs["start_time"]

        # Past-date check
        if date < timezone.localdate():
            raise serializers.ValidationError({"date": "Cannot book a date in the past."})

        # Doctor works at branch
        if not doctor.branches.filter(id=branch.id).exists():
            raise serializers.ValidationError({"branch": "Doctor does not work at this branch."})

        # Doctor offers service
        if not doctor.services.filter(id=service.id).exists():
            raise serializers.ValidationError({"service": "Doctor does not offer this service."})

        # Availability check (same as before)
        availabilities = DoctorAvailability.objects.filter(
            doctor=doctor, branch=branch,
            weekday=date.strftime("%A").lower(),
        )
        if not availabilities.exists():
            raise serializers.ValidationError({"start_time": "Doctor is not available on this day."})

        # Check slot is within availability and not booked
        booked = set(
            Booking.objects.filter(
                doctor=doctor, branch=branch, date=date,
                status__in=[BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED],
            ).values_list("start_time", flat=True)
        )
        valid_slot = False
        calculated_end_time = None
        for avail in availabilities:
            cursor = datetime.combine(date, avail.start_time)
            end = datetime.combine(date, avail.end_time)
            step = timedelta(minutes=avail.slot_duration_minutes)
            while cursor + step <= end:
                if cursor.time() == start_time:
                    valid_slot = True
                    calculated_end_time = (cursor + step).time()
                    break
                cursor += step
            if valid_slot:
                break
        if not valid_slot:
            raise serializers.ValidationError({"start_time": "Slot is outside doctor's available hours."})
        if start_time in booked:
            raise serializers.ValidationError({"start_time": "This slot is already booked."})

        attrs["end_time"] = calculated_end_time
        return attrs

    def create(self, validated_data):
        # Fee is set to service's default fee (no overrides)
        service = validated_data["service"]
        validated_data["fee"] = service.default_fee
        return super().create(validated_data)


class BookingSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        print("BOOKING SERIALIZER USED")
        return super().to_representation(instance)
    patient = serializers.CharField(source="patient.user.get_full_name", read_only=True)
    doctor = serializers.CharField(source="doctor.user.get_full_name", read_only=True)
    service = serializers.CharField(source="service.name", read_only=True)
    branch = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "patient",
            "doctor",
            "service",
            "branch",
            "date",
            "start_time",
            "end_time",
            "status",
            "fee",
            "notes",
            "created_at",
        ]
