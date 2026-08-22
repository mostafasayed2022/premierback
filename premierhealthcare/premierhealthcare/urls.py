"""
Root URL configuration.

Dynamic admin routes are registered via the schema registry.
The router is built inside get_dynamic_router() so it runs after
Django's app registry is ready — never at module import time.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings                          # ✅ not from premierhealthcare
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenRefreshView

from client.views import AdminTokenObtainPairView, AdminLogoutView
from core.views import admin_index
from core.viewsets import AdminModelViewSet
from apps.schema.registry import registry


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_serializer_getter(read_cls, write_cls):
    """
    Returns a get_serializer_class method that dispatches on HTTP verb.
    Extracted from urls.py because it's viewset logic, not routing config.
    """
    def get_serializer_class(self):
        return read_cls if self.request.method == "GET" else write_cls
    return get_serializer_class


def _build_dynamic_router() -> DefaultRouter:
    """
    Walk the schema registry and register one ViewSet per model.

    Called once at startup — deferred into a function so it never
    runs at import time (which would fire before Django's app registry
    is ready and raise AppRegistryNotReady).
    """
    # Autodiscover explicit schemas first; then auto-register anything
    # without an explicit schema. Explicit schemas always win.
    registry.autodiscover()
    registry.auto_register_all_models()

    router = DefaultRouter()

    # Routes that have hand-written ViewSets and should NOT be auto-generated.
    EXPLICIT_ROUTES = {"products", "categories", "users", "files"}

    for q_name, schema_class in registry.all().items():
        model    = schema_class.model
        endpoint = schema_class.endpoint
        if not endpoint:
            continue

        # Strip leading "api/" and slashes to get the router prefix
        route_name = endpoint.strip("/")
        if route_name.startswith("api/"):
            route_name = route_name[4:].strip("/")

        if route_name in EXPLICIT_ROUTES:
            continue

        # ── Auto serializer ─────────────────────────────────────────────────
        exclude = getattr(schema_class, "exclude", None)
        meta_attrs = {"model": model}
        if exclude:
            meta_attrs["exclude"] = exclude
        else:
            meta_attrs["fields"] = "__all__"

        flat_serializer = type(
            f"{model.__name__}Serializer",
            (serializers.ModelSerializer,),
            {"Meta": type("Meta", (), meta_attrs)},
        )

        # Explicit > auto-generated. Write serializer intentionally does NOT
        # fall back to read_serializer_class (read shapes may have computed /
        # read-only fields that shouldn't gate write validation).
        read_cls  = getattr(schema_class, "read_serializer_class",  None) or flat_serializer
        write_cls = getattr(schema_class, "write_serializer_class", None) or flat_serializer

        # ── ViewSet ─────────────────────────────────────────────────────────
        viewset = type(
            f"{model.__name__}ViewSet",
            (AdminModelViewSet,),
            {
                "queryset":       model.objects.all(),
                "get_serializer_class": _make_serializer_getter(read_cls, write_cls),
                "search_fields":  getattr(schema_class, "search_fields", []),
                "ordering":       getattr(schema_class, "ordering", ["-id"]),
            },
        )

        router.register(route_name, viewset, basename=route_name)

    return router


# ── Router (built once at startup, never at import time) ──────────────────────

dynamic_router = _build_dynamic_router()

# urls.py

from client.serializers import BookingSerializer, BookingCreateSerializer
from client.models import Booking

# ✅ Explicit BookingViewSet — bypasses auto-generated flat serializer
class BookingAdminViewSet(AdminModelViewSet):
    queryset = Booking.objects.select_related(
        "patient__user", "doctor__user", "service", "branch"
    ).order_by("-date")
    search_fields = [
        "patient__user__first_name",
        "patient__user__last_name",
        "patient__user__username",
        "patient__phone_number",
        "doctor__user__first_name",
        "doctor__user__last_name",
        "doctor__user__username",
        "service__name",
        "branch__name",
        "status",
    ]
    filterset_fields = ["status", "date", "doctor", "service", "branch"]

    def get_serializer_class(self):
        return BookingSerializer if self.request.method == "GET" else BookingCreateSerializer

# Register it on a dedicated router
admin_router = DefaultRouter()
admin_router.register("bookings", BookingAdminViewSet, basename="admin-bookings")


# ── URL patterns ─────────────────────────────────────────────────────────────
from django.shortcuts import redirect

def booking_list_redirect(request):
    return redirect('/api/admin/bookings/')

# In urls.py, before the router patterns:
def files_list_redirect(request):
    return redirect('/api/files/')
urlpatterns = [
    path('files/',files_list_redirect),
    path('api/bookings/', booking_list_redirect),

    path("api/admin/", include(admin_router.urls)),
    # Django admin
    path("django-admin/", admin.site.urls),

    # Client app
    path("api/", include("client.urls")),

    # Auth
    path("api/auth/login/",   AdminTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(),         name="token_refresh"),
    path("api/auth/logout/",  AdminLogoutView.as_view(),          name="token_logout"),

    # Resource APIs with hand-written ViewSets
    
    path("api/", include("apps.files.urls")),

    # Schema introspection API
    path("api/schema/", include("apps.schema.urls")),

    # Dynamic CRUD routes for registry-managed models
    path("api/", include(dynamic_router.urls)),

    # React SPA catch-all (must be last)
    re_path(r"^admin/.*$", admin_index, name="admin_index"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)