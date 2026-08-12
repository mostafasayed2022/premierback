from rest_framework import serializers
from .models import File


VIDEO_CONTENT_TYPES = {
    'video/mp4', 'video/quicktime', 'video/webm', 'video/avi',
    'video/x-msvideo', 'video/x-matroska', 'video/ogg', 'video/x-flv',
}

VIDEO_EXTENSIONS = {
    'mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v', 'ogv',
    'mp3', 'ogg', 'flv', 'wmv',
}


class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            "id",
            "original_name",
            "size",
            "size_display",
            "content_type",
            "extension",
            "url",
            "created_at",
        ]
        read_only_fields = fields

    def _is_video(self, obj) -> bool:
        """Check if this file is a video using content_type or extension."""
        if obj.content_type in VIDEO_CONTENT_TYPES:
            return True
        return obj.extension.lower() in VIDEO_EXTENSIONS

    def get_url(self, obj):
        """
        Build the correct Cloudinary URL.

        The stored file field value may be a Cloudinary public_id without the
        file extension (e.g. 'uploads/1/my_video').  In that case the default
        storage.url() call uses resource_type='image' and produces a broken URL
        for videos.  We detect this and rebuild the URL with the correct
        resource_type using the cloudinary SDK directly.
        """
        try:
            raw_url = obj.file.url  # Goes through AutoTypeCloudinaryStorage.url()
        except Exception:
            return None

        # If the URL already contains the correct Cloudinary resource path, return it
        if '/video/upload/' in raw_url or '/image/upload/' in raw_url:
            # For videos stored before the fix (public_id has no extension),
            # the URL may wrongly say /image/upload/.  Correct it.
            if self._is_video(obj) and '/image/upload/' in raw_url:
                raw_url = raw_url.replace('/image/upload/', '/video/upload/', 1)
            return raw_url

        # Absolute URL built by request.build_absolute_uri — same correction
        request = self.context.get("request")
        if request:
            abs_url = request.build_absolute_uri(raw_url)
            if self._is_video(obj) and '/image/upload/' in abs_url:
                abs_url = abs_url.replace('/image/upload/', '/video/upload/', 1)
            return abs_url

        return raw_url

    def get_size_display(self, obj):
        size = obj.size
        for unit in ("B", "KB", "MB", "GB"):
            if size < 1024:
                return f"{size:.1f} {unit}" if unit != "B" else f"{size} B"
            size /= 1024
        return f"{size:.1f} TB"