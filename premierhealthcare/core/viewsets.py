"""
Base ViewSet that all admin resource ViewSets inherit from.

Provides:
- JWT authentication enforcement
- IsAdminUser permission
- Standardized error responses
- Full exception logging (both DRF and non-DRF exceptions)
- Audit logging hooks (pre/post save)
"""
import logging

from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend 

logger = logging.getLogger(__name__)


class AdminModelViewSet(viewsets.ModelViewSet):
    """
    Drop-in replacement for ModelViewSet with admin-level auth enforced.
    All resource viewsets inherit from this.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    search_fields:   list[str] = []
    ordering_fields: list[str] = "__all__"
    ordering:        list[str] = ["-id"]
    

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
        """
        Two-layer exception handling:

        Layer 1 — DRF exceptions (ValidationError, NotFound, PermissionDenied,
          AuthenticationFailed, etc.): super().handle_exception() converts these
          to Response objects. Logged at WARNING level.

        Layer 2 — Non-DRF exceptions (AttributeError, TypeError, ValueError,
          database errors, etc.): super() re-raises these; we catch them here,
          log at ERROR level with full traceback, then re-raise so Django's
          global error handler (500 page / Sentry / etc.) can take over.
          In DEBUG mode this surfaces the traceback in the browser. In production
          it returns a 500 — which is correct; don't swallow unexpected errors.

        BUG WAS: non-DRF exceptions were re-raised by super() and never logged,
        making silent 500s with no trace in the admin log.
        """
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