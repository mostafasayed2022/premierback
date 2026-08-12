from apps.schema.registry import registry
from apps.schema.base import AdminSchema
from .models import File

@registry.register
class FileSchema(AdminSchema):
    model        = File
    endpoint     = "/api/files/"
    list_display = ["id", "original_name", "extension", "size", "created_at"]
    search_fields = ["original_name"]
    ordering     = ["-created_at"]
    use_explicit_viewset = True   # your file views are explicit