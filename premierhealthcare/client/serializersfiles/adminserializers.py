from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from client.models import CustomUser
from apps.files.models import File


class EntityVideoMixin(serializers.Serializer):
    video_id = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.all(),
        source='video',
        write_only=True,
        required=False,
        allow_null=True,
    )
    video_file_url = serializers.SerializerMethodField(read_only=True)

    def get_video_file_url(self, obj):
        if obj.video:
            url = obj.video.file.url
            request = self.context.get('request')
            return request.build_absolute_uri(url) if request else url
        return None

    def validate_video_id(self, value):
        # optional: restrict to video types
        if value and value.extension not in ['mp4', 'mov', 'webm', 'avi', 'mkv']:
            raise serializers.ValidationError("File must be a video.")
        return value

class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        username_or_email = attrs.get("username")
        if username_or_email and "@" in username_or_email:
            try:
                user_obj = CustomUser.objects.get(email=username_or_email)
                attrs["username"] = user_obj.username
            except CustomUser.DoesNotExist:
                pass
        
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "role": self.user.role,
            "phone_number": getattr(getattr(self.user, 'patient_profile', None), 'phone_number', '') if self.user.role == 'patient' else '',
        }
        return data

class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_staff:
            raise serializers.ValidationError(
                {"detail": "Admin access required. Your account does not have staff privileges."}
            )

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "is_staff": self.user.is_staff,
            "is_superuser": self.user.is_superuser,
        }
        return data


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "role",
            "last_name",
            "is_staff",
            "is_superuser",
            "is_active",
        ]
        read_only_fields = ["id", "is_superuser"]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user == self.instance:
            if "is_staff" in attrs and not attrs["is_staff"]:
                raise serializers.ValidationError(
                    {"is_staff": "Cannot remove your own staff privileges."}
                )
        return attrs