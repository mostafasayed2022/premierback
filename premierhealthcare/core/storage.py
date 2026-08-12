"""
core/storage.py

Custom Cloudinary storage backend that automatically selects the correct
resource_type (image / video / raw) based on the file extension.

== The problem with MediaCloudinaryStorage ==

1. It hardcodes RESOURCE_TYPE = 'image', so uploading an .mp4 fails with
   "Invalid image file".

2. Even if we override _get_resource_type for the initial upload, Cloudinary
   strips the file extension from the returned public_id
   (e.g. 'uploads/1/my_video.mp4' → stored as 'uploads/1/my_video').
   On subsequent url() / delete() calls _get_resource_type sees no extension
   and defaults to 'image', generating the wrong Cloudinary URL path
   (/image/upload/…  instead of /video/upload/…).

== The fix ==

We override _save() to re-attach the format extension to the public_id
before it is stored in the database.  All later calls to _get_resource_type()
then see the extension and can select the correct resource type.

We also override delete() to strip the extension before calling
cloudinary.uploader.destroy(), since Cloudinary's destroy API expects a
bare public_id without extension.
"""
import os
import cloudinary
import cloudinary.uploader
from django.core.files.uploadedfile import UploadedFile
from cloudinary_storage.storage import MediaCloudinaryStorage


VIDEO_EXTENSIONS = frozenset([
    'mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v', 'ogv',
    'mp3', 'ogg', 'flv', 'wmv', 'aac', 'wav',
])

RAW_EXTENSIONS = frozenset([
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv',
    'txt', 'md', 'zip', 'rar',
])


class AutoTypeCloudinaryStorage(MediaCloudinaryStorage):
    """
    Drop-in replacement for MediaCloudinaryStorage.

    • Detects resource_type ('image' / 'video' / 'raw') from the extension.
    • Re-attaches the extension to the stored public_id so later url()
      and delete() calls also pick the correct resource_type.
    """

    # ── Resource type detection ────────────────────────────────────────
    def _get_resource_type(self, name: str) -> str:
        ext = os.path.splitext(name)[-1].lower().lstrip('.')
        if ext in VIDEO_EXTENSIONS:
            return 'video'
        if ext in RAW_EXTENSIONS:
            return 'raw'
        return 'image'

    # ── Save: re-attach extension to public_id ─────────────────────────
    def _save(self, name, content):
        """
        Upload the file and return a public_id that includes the extension.

        Cloudinary strips the extension from the public_id in its response
        (e.g. 'uploads/1/my_video.mp4' → 'uploads/1/my_video').  We
        re-attach it using response['format'] so downstream calls to
        _get_resource_type() can identify video files correctly.
        """
        normalized = self._normalise_name(name)
        normalized = self._prepend_prefix(normalized)
        upload_content = UploadedFile(content, normalized)
        response = self._upload(normalized, upload_content)

        public_id = response['public_id']
        fmt = response.get('format', '')          # e.g. 'mp4', 'jpg', 'pdf'
        if fmt and not public_id.lower().endswith('.' + fmt):
            public_id = public_id + '.' + fmt     # 'uploads/1/my_video.mp4'

        return public_id

    # ── Delete: strip extension before calling Cloudinary destroy ──────
    def delete(self, name):
        """
        Cloudinary's destroy API expects a bare public_id (no extension).
        Strip the extension we added in _save() before calling destroy.
        """
        public_id, _ = os.path.splitext(name)     # 'uploads/1/my_video'
        resource_type = self._get_resource_type(name)
        response = cloudinary.uploader.destroy(
            public_id,
            invalidate=True,
            resource_type=resource_type,
        )
        return response.get('result') == 'ok'
