from rest_framework import serializers
from client.models import CustomUser , Patient,Role
from django.db import transaction
from .placeserializers import EntityImageMixin


class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=20,
    )

    date_of_birth = serializers.DateField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    username = serializers.CharField(required=False)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "date_of_birth",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    @transaction.atomic
    def create(self, validated_data):
        phone_number = validated_data.pop("phone_number", "")
        date_of_birth = validated_data.pop("date_of_birth", None)

        username = validated_data.pop("username", None)

        if not username:
            base = validated_data["email"].split("@")[0]
            username = base
            counter = 1

            while CustomUser.objects.filter(username=username).exists():
                username = f"{base}_{counter}"
                counter += 1

        user = CustomUser.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=Role.PATIENT,
            is_verified=False,            # fix: start as unverified (security)
        )

        # Created automatically by the post_save signal
        patient = user.patient_profile
        patient.phone_number = phone_number
        patient.date_of_birth = date_of_birth
        patient.save(update_fields=["phone_number", "date_of_birth"])

        return user

class PatientSerializer(EntityImageMixin, serializers.ModelSerializer):
    name = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = Patient
        fields = [
            "id",
            "name",
            "email",
            "gender",
            "phone_number",
            "date_of_birth",
            "image_id",
            "image_url",
        ]

    def validate_name(self, value):
        user_qs = CustomUser.objects.filter(username=value)
        if self.instance and hasattr(self.instance, "user") and self.instance.user:
            user_qs = user_qs.exclude(pk=self.instance.user.pk)
        if user_qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        user_qs = CustomUser.objects.filter(email=value)
        if self.instance and hasattr(self.instance, "user") and self.instance.user:
            user_qs = user_qs.exclude(pk=self.instance.user.pk)
        if user_qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        username = user_data.get("username")
        email = user_data.get("email")

        user = None
        if username:
            user = CustomUser.objects.filter(username=username).first()
        if not user and email:
            user = CustomUser.objects.filter(email=email).first()

        if not user:
            user_data.setdefault("role", Role.PATIENT)
            user = CustomUser.objects.create(**user_data)

        patient, _ = Patient.objects.get_or_create(user=user, defaults=validated_data)
        for attr, value in validated_data.items():
            setattr(patient, attr, value)
        patient.save()
        return patient

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        return super().update(instance, validated_data)