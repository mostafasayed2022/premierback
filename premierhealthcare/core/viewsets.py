import logging

from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend 

logger = logging.getLogger(__name__)


class AdminModelViewSet(viewsets.ModelViewSet):

    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAdminUser]
    filter_backends        = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields:   list[str] = []
    ordering_fields: list[str] = "__all__"
    ordering:        list[str] = ["-id"]
    

    def get_serializer(self, *args, **kwargs):
        from core.content_translation import is_translation_field
        serializer = super().get_serializer(*args, **kwargs)
        target = serializer.child if hasattr(serializer, "child") else serializer
        for name, field in target.fields.items():
            if is_translation_field(name):
                field.read_only = True
                field.required = False
        return serializer

    # ── CRUD hooks ────────────────────────────────────────────────────────────

    def perform_create(self, serializer):
        instance = serializer.save()
        logger.info(
            "ADMIN_CREATE | model=%s | id=%s | user=%s",
            instance.__class__.__name__,
            instance.pk,
            self.request.user.username,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        logger.info(
            "ADMIN_UPDATE | model=%s | id=%s | user=%s",
            instance.__class__.__name__,
            instance.pk,
            self.request.user.username,
        )

    def perform_destroy(self, instance):
        logger.info(
            "ADMIN_DELETE | model=%s | id=%s | user=%s",
            instance.__class__.__name__,
            instance.pk,
            self.request.user.username,
        )
        instance.delete()

    # ── Error handling ────────────────────────────────────────────────────────

    def handle_exception(self, exc):

        try:
            response = super().handle_exception(exc)
        except Exception:
            # Non-DRF exception — log with full traceback then re-raise
            logger.exception(
                "ADMIN_UNHANDLED | model=%s | pk=%s | user=%s",
                self.__class__.__name__,
                self.kwargs.get("pk", "list"),
                getattr(self.request, "user", "anonymous"),
            )
            raise

        # DRF exception — already converted to a Response
        if response is not None:
            logger.warning(
                "ADMIN_ERROR | model=%s | pk=%s | status=%s | detail=%s",
                self.__class__.__name__,
                self.kwargs.get("pk", "list"),
                response.status_code,
                response.data,
            )
        return response
