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
        if not CustomUser.objects.filter(email__iexact=value).exists():
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

# ─── IV Drip / Articles public serializers ────────────────────────────────────

def _absolute_file_url(file_obj, request):
    if not file_obj:
        return None
    try:
        url = file_obj.file.url
    except Exception:
        return None
    return request.build_absolute_uri(url) if request else url


class IVDripPageSerializer(serializers.ModelSerializer):
    heroImage = serializers.SerializerMethodField()
    title_ar = serializers.CharField()
    shortDescription = serializers.CharField(source="short_description")
    shortDescription_ar = serializers.CharField(source="short_description_ar")

    class Meta:
        model = IVDripPage
        fields = ["heroImage", "title", "title_ar", "shortDescription", "shortDescription_ar"]

    def get_heroImage(self, obj):
        return _absolute_file_url(obj.hero_image, self.context.get("request"))


class IVBenefitPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = IVBenefit
        fields = ["id", "icon", "title", "title_ar", "description", "description_ar", "order"]


class IVAdministrationStepPublicSerializer(serializers.ModelSerializer):
    stepNumber = serializers.IntegerField(source="step_number")

    class Meta:
        model = IVAdministrationStep
        fields = ["id", "stepNumber", "icon", "title", "title_ar", "description", "description_ar"]


class IVDripFAQPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = IVDripFAQ
        fields = ["id", "question", "question_ar", "answer", "answer_ar", "order"]


class IVDripProductSummarySerializer(serializers.ModelSerializer):
    tagline = serializers.CharField()
    shortDescription = serializers.CharField(source="short_description")
    shortDescription_ar = serializers.CharField(source="short_description_ar")
    image = serializers.SerializerMethodField()
    durationMinutes = serializers.IntegerField(source="duration_minutes")
    isFeatured = serializers.BooleanField(source="is_featured")

    class Meta:
        model = IVDripProduct
        fields = [
            "id", "name", "name_ar", "slug", "tagline", "tagline_ar",
            "shortDescription", "shortDescription_ar", "image", "price",
            "durationMinutes", "isFeatured", "order",
        ]

    def get_image(self, obj):
        return _absolute_file_url(obj.image, self.context.get("request"))


class IVDripProductDetailSerializer(IVDripProductSummarySerializer):
    whoIsItFor = serializers.CharField(source="who_is_it_for")
    howItHelps = serializers.CharField(source="how_it_helps")
    keyIngredients = serializers.CharField(source="key_ingredients")
    perfectPairings = serializers.CharField(source="perfect_pairings")

    fullDescription = serializers.CharField(source="full_description")
    fullDescription_ar = serializers.CharField(source="full_description_ar")
    faqs = serializers.SerializerMethodField()
    metaTitle = serializers.CharField(source="meta_title", allow_null=True)
    metaTitle_ar = serializers.CharField(source="meta_title_ar", allow_null=True)
    metaDescription = serializers.CharField(source="meta_description", allow_null=True)
    metaDescription_ar = serializers.CharField(source="meta_description_ar", allow_null=True)
    ogImage = serializers.SerializerMethodField()

    class Meta(IVDripProductSummarySerializer.Meta):
        fields = IVDripProductSummarySerializer.Meta.fields + [
            "fullDescription", "fullDescription_ar", "faqs",
            "whoIsItFor", "howItHelps", "keyIngredients", "perfectPairings",
            "metaTitle", "metaTitle_ar", "metaDescription", "metaDescription_ar", "ogImage",
        ]

    def get_faqs(self, obj):
        qs = obj.faqs.filter(is_active=True)
        return IVDripFAQPublicSerializer(qs, many=True, context=self.context).data

    def get_ogImage(self, obj):
        return _absolute_file_url(obj.og_image, self.context.get("request"))


class ArticlesPageSerializer(serializers.ModelSerializer):
    heroImage = serializers.SerializerMethodField()
    shortDescription = serializers.CharField(source="short_description")

    class Meta:
        model = ArticlesPage
        fields = ["title", "shortDescription", "heroImage"]

    def get_heroImage(self, obj):
        return _absolute_file_url(obj.hero_image, self.context.get("request"))


class ArticleCategoryPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCategory
        fields = ["id", "name", "name_ar", "slug"]


def _article_author(obj, request):
    if obj.author_type == Article.AuthorType.DOCTOR and obj.author_doctor:
        d = obj.author_doctor
        return {
            "type": "doctor",
            "id": d.id,
            "name": d.user.get_full_name(),
            "name_ar": d.user.get_full_name(),
            "slug": d.user.get_full_name().lower().replace(" ", "-"),
            "avatar": _absolute_file_url(d.image, request),
        }
    return {
        "type": "plain",
        "name": obj.author_name,
        "name_ar": obj.author_name_ar or obj.author_name,
    }


class ArticleSummarySerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    coverImage = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    publishedAt = serializers.DateTimeField(source="published_at")
    readingTimeMinutes = serializers.IntegerField(source="reading_time_minutes")

    class Meta:
        model = Article
        fields = [
            "id", "title", "title_ar", "slug", "category", "tags",
            "excerpt", "excerpt_ar", "coverImage", "author", "publishedAt", "readingTimeMinutes",
        ]

    def get_category(self, obj):
        return ArticleCategoryPublicSerializer(obj.category).data if obj.category else None

    def get_tags(self, obj):
        return obj.tags if isinstance(obj.tags, list) else []

    def get_coverImage(self, obj):
        return _absolute_file_url(obj.cover_image, self.context.get("request"))

    def get_author(self, obj):
        return _article_author(obj, self.context.get("request"))


class ArticleDetailSerializer(ArticleSummarySerializer):
    content = serializers.CharField()
    content_ar = serializers.CharField()
    relatedArticles = serializers.SerializerMethodField()
    metaTitle = serializers.CharField(source="meta_title", allow_null=True)
    metaTitle_ar = serializers.CharField(source="meta_title_ar", allow_null=True)
    metaDescription = serializers.CharField(source="meta_description", allow_null=True)
    metaDescription_ar = serializers.CharField(source="meta_description_ar", allow_null=True)
    ogImage = serializers.SerializerMethodField()

    class Meta(ArticleSummarySerializer.Meta):
        fields = ArticleSummarySerializer.Meta.fields + [
            "content", "content_ar", "relatedArticles",
            "metaTitle", "metaTitle_ar", "metaDescription", "metaDescription_ar", "ogImage",
        ]

    def get_relatedArticles(self, obj):
        related = obj.related_articles.filter(is_published=True)[:3]
        return ArticleSummarySerializer(related, many=True, context=self.context).data

    def get_ogImage(self, obj):
        return _absolute_file_url(obj.og_image, self.context.get("request"))
# ─── Article Admin serializers ────────────────────────────────────────────────

class ArticleAdminSerializer(serializers.ModelSerializer):
    """
    Read serializer for the admin panel.
    Exposes ALL articles (including unpublished), adds computed URL fields
    for cover/og images so the React Admin list table can render thumbnails.
    """
    category_name = serializers.CharField(
        source="category.name", read_only=True, allow_null=True, default=None
    )
    cover_image_url = serializers.SerializerMethodField()
    og_image_url    = serializers.SerializerMethodField()

    class Meta:
        model  = Article
        fields = "__all__"

    def _file_url(self, file_obj):
        if not file_obj:
            return None
        request = self.context.get("request")
        # Adjust attribute name if your File model uses a different field
        raw = getattr(file_obj, "url", None) or getattr(file_obj, "file", None)
        if callable(raw):
            raw = raw()
        url = str(raw) if raw else None
        return request.build_absolute_uri(url) if (request and url) else url

    def get_cover_image_url(self, obj):
        return self._file_url(obj.cover_image)

    def get_og_image_url(self, obj):
        return self._file_url(obj.og_image)


class ArticleWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer used for POST / PUT / PATCH from the admin panel.
    Flat FK fields (cover_image, og_image, category, author_doctor)
    accept integer PKs — React Admin sends raw IDs.
    related_articles accepts a list of integer PKs (M2M).
    """
    class Meta:
        model  = Article
        fields = [
            "title", "title_ar",
            "slug",
            "category",               # FK → accepts integer PK
            "tags",                   # JSONField — list of strings
            "excerpt", "excerpt_ar",
            "content", "content_ar",
            "cover_image",            # FK → accepts integer PK
            "og_image",               # FK → accepts integer PK
            "author_type",
            "author_doctor",          # FK → accepts integer PK (nullable)
            "author_name", "author_name_ar",
            "published_at",
            "reading_time_minutes",
            "related_articles",       # M2M → accepts list of integer PKs
            "meta_title", "meta_title_ar",
            "meta_description", "meta_description_ar",
            "is_published",
        ]


class ArticleCategoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ArticleCategory
        fields = "__all__"

