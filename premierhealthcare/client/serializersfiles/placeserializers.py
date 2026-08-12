from rest_framework import serializers
from client.models import Department , Service , Branch ,Testimonial,Gallery,GalleryCategory,GalleryImage,BranchGallery
from apps.files.models import File
from django.core.exceptions import ObjectDoesNotExist

# client/serializers.py

VIDEO_EXTENSIONS = {'mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v', 'ogv', 'mp3', 'ogg', 'flv', 'wmv'}


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
        if not obj.video:
            return None
        try:
            url = obj.video.file.url
        except Exception:
            return None
        # Fix: for old records the storage may have returned /image/upload/
        # even though the file is a video. Correct the Cloudinary resource path.
        if '/image/upload/' in url and obj.video.extension in VIDEO_EXTENSIONS:
            url = url.replace('/image/upload/', '/video/upload/', 1)
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url

    def validate_video_id(self, value):
        if value and value.extension not in VIDEO_EXTENSIONS:
            raise serializers.ValidationError(
                f"File must be a video. Got .{value.extension}"
            )
        return value


class EntityImageMixin(serializers.Serializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.all(),
        source='image',
        write_only=False,
        required=False,
        allow_null=True,
    )
    image_url = serializers.SerializerMethodField(read_only=True)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        try:
            url = obj.image.file.url
        except Exception:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def validate_image_id(self, value):
        if value and value.extension not in ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif']:
            raise serializers.ValidationError("File must be an image.")
        return value




class DepartmentSerializer(EntityImageMixin,serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    icon = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")

    class Meta:
        model = Department
        fields = ["id", "name", "slug", "description", "icon", "is_active", "image_id", "image_url"]

    def validate(self, attrs):
        attrs.setdefault("icon", "")
        if "description" in attrs and attrs["description"] is None:
            attrs["description"] = ""
        return super().validate(attrs)


class ServiceSerializer(EntityImageMixin,serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    department_slug = serializers.CharField(source='department.slug', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "slug", "department", "department_slug", "department_name", "description", "duration_minutes", "default_fee", "is_active", "image_id", "image_url"]

    def validate(self, attrs):
        if "description" in attrs and attrs["description"] is None:
            attrs["description"] = ""
        return super().validate(attrs)






class CommaSeparatedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A PrimaryKeyRelatedField that accepts:
      - A JSON array of PKs: [1, 2, 3]
      - A comma‑separated string: "1,2,3"
      - A single PK: 1
    Always returns a list of model instances (many=True enforced).
    """
    def __init__(self, **kwargs):
        kwargs['many'] = True          # keep it for schema detection
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        # 1. Normalise data into a list of raw values
        if isinstance(data, str):
            data = data.strip()
            if not data:
                return []
            data = [x.strip() for x in data.split(",") if x.strip()]
        elif isinstance(data, (int, float)):
            data = [data]
        elif not isinstance(data, list):
            self.fail('not_a_list', input_type=type(data).__name__)

        # 2. Convert each raw value to a model instance using the queryset
        result = []
        for item in data:
            try:
                # Try to get the instance by primary key
                instance = self.queryset.get(pk=item)
            except (ValueError, TypeError, ObjectDoesNotExist):
                self.fail('incorrect_type', pk=item)
            result.append(instance)
        return result

    def to_representation(self, value):
        # Return a list of primary keys (the default for many=True)
        return [item.pk for item in value] if hasattr(value, '__iter__') else value.pk
    
class BranchSerializer(EntityImageMixin, serializers.ModelSerializer):
    services = CommaSeparatedPrimaryKeyRelatedField(queryset=Service.objects.all(), required=False)
    service_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Branch
        fields = ["id", "name", "address", "city", "phone", "latitude", "longitude", "is_active", "image_id", "image_url", "services", "service_names"]
        read_only_fields = ["id"]

    def get_service_names(self, obj):
        return list(obj.services.values_list('name', flat=True))

    def create(self, validated_data):
        services_objects = validated_data.pop('services', [])
        branch = super().create(validated_data)
        if services_objects:
            branch.services.set(services_objects)
        return branch

    def update(self, instance, validated_data):
        services_objects = validated_data.pop('services', None)
        instance = super().update(instance, validated_data)
        if services_objects is not None:
            instance.services.set(services_objects)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['services'] = list(instance.services.values_list('id', flat=True))
        return data
# class BranchServiceSerializer(EntityImageMixin,serializers.ModelSerializer):
#     effective_fee = serializers.SerializerMethodField()

#     class Meta:
#         model = Branch
#         fields = ["id", "name", "address", "city", "phone", "latitude", "longitude", "effective_fee","image_id", "image_url"]

#     def get_effective_fee(self, obj):
#         service_id = self.context.get("service_id")
#         if not service_id:
#             return None
#         bs = BranchService.objects.filter(branch=obj, service_id=service_id).first()
#         return bs.effective_fee if bs else None


class TestimonialSerializer(EntityImageMixin, EntityVideoMixin, serializers.ModelSerializer):
    role = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")

    class Meta:
        model = Testimonial
        fields = [
            "id", "name", "role", "rating",
            "text", "video_url", "is_active", "created_at",
            "image_id", "image_url", "video_id", "video_file_url"
        ]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        for field in ["name_ar", "role_ar", "text_ar"]:
            attrs.setdefault(field, "")
        if "role" in attrs and attrs["role"] is None:
            attrs["role"] = ""
        return super().validate(attrs)

class GalleryImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    id = serializers.IntegerField(source="file.id")
    original_name = serializers.CharField(source="file.original_name")

    class Meta:
        model = GalleryImage
        fields = ["id", "original_name", "url", "order"]

    def get_url(self, obj):
        request = self.context.get("request")
        url = obj.file.file.url
        return request.build_absolute_uri(url) if request else url


class GallerySerializer(EntityImageMixin, EntityVideoMixin, serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    images = GalleryImageSerializer(many=True, read_only=True)
    image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of File IDs to attach to this gallery"
    )

    class Meta:
        model = Gallery
        fields = [
            "id", "title", "category", "media_type", "description",
            "is_active", "created_at", "image_id", "image_url", "video_id", "video_file_url", "video_url",
            "images", "image_ids"
        ]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        for field in ["title_ar", "description_ar"]:
            attrs.setdefault(field, "")
        if "description" in attrs and attrs["description"] is None:
            attrs["description"] = ""
        return super().validate(attrs)

    def create(self, validated_data):
        image_ids = validated_data.pop("image_ids", [])
        gallery = super().create(validated_data)
        for idx, file_id in enumerate(image_ids):
            try:
                file = File.objects.get(pk=file_id)
                GalleryImage.objects.create(gallery=gallery, file=file, order=idx)
            except File.DoesNotExist:
                continue
        return gallery

    def update(self, instance, validated_data):
        image_ids = validated_data.pop("image_ids", None)
        instance = super().update(instance, validated_data)
        if image_ids is not None:
            # Remove existing images and replace with new set
            instance.images.all().delete()
            for idx, file_id in enumerate(image_ids):
                try:
                    file = File.objects.get(pk=file_id)
                    GalleryImage.objects.create(gallery=instance, file=file, order=idx)
                except File.DoesNotExist:
                    continue
        return instance


class BranchGallerySerializer(EntityImageMixin, serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")

    class Meta:
        model = BranchGallery
        fields = [
            "id", "branch", "branch_name", "title",
            "image_id", "image_url", "description",
            "order", "is_active", "created_at"
        ]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        for field in ["title_ar", "description_ar"]:
            attrs.setdefault(field, "")
        if "description" in attrs and attrs["description"] is None:
            attrs["description"] = ""
        return super().validate(attrs)

