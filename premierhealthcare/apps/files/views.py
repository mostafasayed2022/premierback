import os
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.throttling import UserRateThrottle

from core.services.files import upload_file, get_user_files, delete_file
from .serializers import FileSerializer

MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB  for images / docs
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB for videos

IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
VIDEO_EXTENSIONS = {'mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v', 'ogv', 'mp3'}
DOC_EXTENSIONS   = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'md'}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | DOC_EXTENSIONS


class FileListUploadView(APIView):
    """
    GET  /api/files/        — list all files for the current admin user
    POST /api/files/        — upload a new file (multipart/form-data, field: "file")
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        files = get_user_files(request.user)
        serializer = FileSerializer(files, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response(
                {"detail": "No file provided. Send a multipart/form-data request with field 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Extension validation
        _, ext = os.path.splitext(uploaded.name)
        ext = ext.lower().lstrip(".")
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {"detail": f"File type '.{ext}' is not supported. Allowed: images, videos (mp4/mov/webm…), and documents."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Size validation (videos get a higher limit)
        is_video = ext in VIDEO_EXTENSIONS
        max_size  = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE
        max_label = "100 MB" if is_video else "10 MB"
        if uploaded.size > max_size:
            return Response(
                {"detail": f"File size exceeds the maximum limit of {max_label} for {'videos' if is_video else 'images/documents'}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Storage Upload & Error Handling
        try:
            instance = upload_file(request.user, uploaded)
        except Exception as e:
            return Response(
                {"detail": f"Failed to upload to storage: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = FileSerializer(instance, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FileDetailView(APIView):
    """
    DELETE /api/files/<id>/  — delete a file (owner only)
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, file_id):
        try:
            delete_file(request.user, file_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ObjectDoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            return Response({"detail": "You do not own this file."}, status=status.HTTP_403_FORBIDDEN)