# serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import *

from django.db import transaction
from .serializersfiles.doctorserializers import *
from .serializersfiles.bookingserializers import *
from .serializersfiles.adminserializers import *
from .serializersfiles.patientserializers import *
from .serializersfiles.placeserializers import*
from rest_framework import serializers
from django.contrib.auth.hashers import is_password_usable
from .models import CustomUser

class DoctorPublicSerializer(EntityImageMixin,serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    specialty = serializers.CharField(source="specialization", read_only=True)   # lowercase alias
    image_url = serializers.SerializerMethodField()
      # or just a static value

    class Meta:
        model = Doctor
        fields = ["id", "name", "specialty", "position", "bio", "experience", "patients", "languages", "image_url"]
    

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            url = obj.image.file.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

   

class ServicepublicSerializer(EntityImageMixin,serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    department_slug = serializers.CharField(source='department.slug', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "slug", "department", "department_slug", "department_name", "description", 
                  "duration_minutes", "default_fee", "image_id", "image_url", 
                  "category"]

    def get_category(self, obj):
        return obj.department.slug if obj.department else None

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = "__all__"
        

    def validate(self, data):
        # Only run this check when password is being set (create or update)
        # If no password in data, we look at the instance for updates
        password = data.get("password")
        role = data.get("role", getattr(self.instance, "role", None))

        # Determine if we are updating and not changing password
        if password is None and self.instance:
            # No password change → check existing password
            if role in [Role.DOCTOR, Role.ADMIN] and not self.instance.has_usable_password():
                raise serializers.ValidationError({
                    "password": "A usable password is required for this role."
                })
        elif password is not None:
            # Password is being set – simply ensure it’s not empty
            if not password:
                raise serializers.ValidationError({
                    "password": "Password cannot be empty."
                })
        else:
            # Creating a new user without a password
            if role in [Role.DOCTOR, Role.ADMIN]:
                raise serializers.ValidationError({
                    "password": "A password is required for this role."
                })

        return data

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user is associated with this email.")
        return value

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)


class AvailableSlotSerializer(serializers.Serializer):
    """Not a ModelSerializer — slots are computed, not stored rows."""
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()



