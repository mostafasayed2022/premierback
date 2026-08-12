"""
Schema API Views

GET /api/schema/           → list all registered schemas (sidebar nav)
GET /api/schema/<model>/   → full schema for one model
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication

from .registry import registry


class SchemaListView(APIView):
    """
    Returns a lightweight list of all registered admin models.
    Used by the React sidebar to build navigation dynamically.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request):
        return Response({"schemas": registry.to_listing()})


class SchemaDetailView(APIView):
    """
    Returns the full schema for a single model including all field metadata.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request, model_name: str):
        # ✅ Case-insensitive qualified or bare lookup — no debug prints
        schema_class = registry.get(model_name.strip())
        if schema_class is None:
            return Response(
                {"error": f"No schema registered for model '{model_name}'."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(schema_class.to_dict())