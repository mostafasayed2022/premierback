"""
Schema field definitions and base AdminSchema class.

The schema system is the source-of-truth bridge between Django models
and the React renderer. Each registered schema describes:
  - What model it wraps
  - What fields are exposed (with types, constraints, read-only flags)
  - What the API endpoint is
  - Display configuration (list columns, search fields, ordering)

Field type mapping (Django → React renderer type):
  CharField / TextField        → "string" / "text"
  IntegerField / FloatField    → "number"
  BooleanField                 → "boolean"
  DateTimeField / DateField    → "datetime" / "date"
  ForeignKey                   → "relation"
  EmailField                   → "email"
  URLField                     → "url"
  FileField / ImageField       → "file"
  ChoiceField                  → "select"
  Nested serializer (single)   → "nested"
  Nested serializer (many)     → "nested_list"
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any, Optional
import django.db.models as django_fields
from rest_framework import serializers as drf_serializers
from rest_framework.relations import RelatedField
from apps.schema.registry import registry


# ─── Field descriptors ───────────────────────────────────────────────────────

@dataclass
class SchemaField:
    name: str
    type: str
    label: str = ""
    read_only: bool = False
    required: bool = True
    nullable: bool = False
    help_text: str = ""
    max_length: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    choices: list[dict] = field(default_factory=list)
    multiple: bool = False
    related_model: Optional[str] = None
    related_endpoint: Optional[str] = None
    nested_fields: list[dict] = field(default_factory=list)
    show_in_list: bool = True
    sortable: bool = True
    searchable: bool = False
    related_model_qualified_name: Optional[str] = None
    filters: Optional[dict] = None

    def __post_init__(self):
        if not self.label:
            self.label = self.name.replace("_", " ").title()

    def to_dict(self) -> dict:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}


# ─── Django field → SchemaField converter ───────────────────────────────────

_DJANGO_TYPE_MAP: list[tuple[type, str]] = [
    (django_fields.EmailField,              "email"),
    (django_fields.URLField,               "url"),
    (django_fields.SlugField,              "string"),
    (django_fields.ImageField,             "file"),
    (django_fields.BigAutoField,           "number"),
    (django_fields.SmallAutoField,         "number"),
    (django_fields.AutoField,              "number"),
    (django_fields.PositiveSmallIntegerField, "number"),
    (django_fields.PositiveIntegerField,   "number"),
    (django_fields.SmallIntegerField,      "number"),
    (django_fields.BigIntegerField,        "number"),
    (django_fields.OneToOneField,          "relation"),
    (django_fields.CharField,              "string"),
    (django_fields.TextField,              "text"),
    (django_fields.IntegerField,           "number"),
    (django_fields.FloatField,             "number"),
    (django_fields.DecimalField,           "number"),
    (django_fields.BooleanField,           "boolean"),
    (django_fields.DateTimeField,          "datetime"),
    (django_fields.DateField,              "date"),
    (django_fields.TimeField,              "time"),
    (django_fields.FileField,              "file"),
    (django_fields.ForeignKey,             "relation"),
    (django_fields.JSONField,              "json"),
    (django_fields.UUIDField,              "string"),
]


def _fallback_endpoint(model) -> str:
    """Return a safe endpoint string from a model's verbose_name_plural."""
    name = model._meta.verbose_name_plural or f"{model.__name__.lower()}s"
    return f"/api/{name.lower().replace(' ', '')}/"


def django_field_to_schema(f: django_fields.Field) -> SchemaField:
    schema_type = "string"
    for django_type, mapped in _DJANGO_TYPE_MAP:
        if isinstance(f, django_type):
            schema_type = mapped
            break

    kwargs: dict[str, Any] = {
        "name": f.name,
        "type": schema_type,
        "read_only": not f.editable,
        "required": not f.blank and not f.null,
        "nullable": f.null,
        "help_text": str(f.help_text) if f.help_text else "",
    }

    if hasattr(f, "max_length") and f.max_length:
        kwargs["max_length"] = f.max_length

    if f.choices:
        kwargs["type"] = "select"
        kwargs["choices"] = [{"value": v, "label": str(l)} for v, l in f.choices]

    if isinstance(f, (django_fields.ForeignKey, django_fields.OneToOneField)):
        related = f.related_model
        if related:
            kwargs["related_model"] = related.__name__
            qualified_name = f"{related._meta.app_label}.{related.__name__}"
            kwargs["related_model_qualified_name"] = qualified_name
            schema_cls = registry.get(qualified_name)
            kwargs["related_endpoint"] = (
                schema_cls.endpoint
                if (schema_cls and schema_cls.endpoint)
                else _fallback_endpoint(related)
            )

    if isinstance(f, (django_fields.AutoField, django_fields.BigAutoField, django_fields.SmallAutoField)):
        kwargs["read_only"] = True
        kwargs["required"] = False

    if isinstance(f, django_fields.UUIDField) and f.primary_key:
        kwargs["read_only"] = True
        kwargs["required"] = False

    if isinstance(f, (django_fields.DateTimeField, django_fields.DateField)):
        if getattr(f, "auto_now", False) or getattr(f, "auto_now_add", False):
            kwargs["read_only"] = True
            kwargs["required"] = False
            kwargs["show_in_list"] = True

    return SchemaField(**kwargs)


# ─── DRF serializer field → (type, choices, is_multiple) converter ──────────

_DRF_TYPE_MAP: list[tuple[type, str]] = [
    (drf_serializers.EmailField,       "email"),
    (drf_serializers.URLField,         "url"),
    (drf_serializers.SlugField,        "string"),
    (drf_serializers.ImageField,       "file"),
    (drf_serializers.BooleanField,     "boolean"),
    (drf_serializers.DecimalField,     "number"),
    (drf_serializers.FloatField,       "number"),
    (drf_serializers.IntegerField,     "number"),
    (drf_serializers.DateTimeField,    "datetime"),
    (drf_serializers.DateField,        "date"),
    (drf_serializers.TimeField,        "time"),
    (drf_serializers.FileField,        "file"),
    (drf_serializers.CharField,        "string"),
    (drf_serializers.UUIDField,        "string"),
]


def _choice_list(choice_field) -> list[dict]:
    return [{"value": v, "label": str(l)} for v, l in choice_field.choices.items()]


def _nested_fields_from_serializer(serializer: drf_serializers.BaseSerializer) -> list[dict]:
    if not hasattr(serializer, "fields"):
        return []
    result = []
    for name, child in serializer.fields.items():
        f_type, choices, is_multiple = _drf_field_to_type(child)
        if f_type is None:
            continue
        sf = SchemaField(
            name=name,
            type=f_type,
            read_only=child.read_only,
            required=child.required,
            choices=choices or [],
            multiple=is_multiple,
            show_in_list=False,
        )
        result.append(sf.to_dict())
    return result


def _drf_field_to_type(field) -> tuple[str | None, list[dict] | None, bool]:
    # ManyRelatedField must be checked BEFORE RelatedField (it's a subclass)
    if isinstance(field, drf_serializers.ManyRelatedField):
        return "relation", None, True

    if isinstance(field, RelatedField):
        many = getattr(field, "many", False)   # defensive getattr
        return "relation", None, many

    if isinstance(field, drf_serializers.ListSerializer):
        return "nested_list", None, True

    if isinstance(field, drf_serializers.BaseSerializer):
        return "nested", None, False

    if isinstance(field, drf_serializers.ListField):
        child = field.child
        if isinstance(child, drf_serializers.ChoiceField):
            return "select", _choice_list(child), True
        return None, None, False

    if isinstance(field, drf_serializers.ChoiceField):
        return "select", _choice_list(field), False

    for drf_type, mapped in _DRF_TYPE_MAP:
        if isinstance(field, drf_type):
            return mapped, None, False

    return "string", None, False


# ─── Base AdminSchema class ──────────────────────────────────────────────────

class AdminSchema:
    read_serializer_class = None
    write_serializer_class = None
    model = None
    endpoint: str = ""
    list_display: list[str] = []
    filterset_fields: list[str] = []
    search_fields: list[str] = []
    ordering: list[str] = ["-id"]
    use_explicit_viewset: bool = False
    fields: list[SchemaField] = []
    exclude: list[str] = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        for attr in ("list_display", "search_fields", "ordering", "fields", "exclude"):
            if attr not in cls.__dict__:
                setattr(cls, attr, list(getattr(cls, attr, [])))

    @classmethod
    def get_name(cls) -> str:
        return cls.model.__name__ if cls.model else cls.__name__.replace("Schema", "")

    @classmethod
    def get_serializer_class(cls):
        return cls.write_serializer_class or cls.read_serializer_class

    @classmethod
    def get_fields(cls) -> list[SchemaField]:
        if cls.fields:
            return cls.fields
        if cls.model is None:
            return []

        introspected: list[SchemaField] = []

        # ── Model fields ──────────────────────────────────────────────────
        for f in cls.model._meta.get_fields():
            if f.is_relation and (f.one_to_many or f.many_to_many):
                continue
            if not hasattr(f, "column"):
                continue
            if f.name in cls.exclude:
                continue
            sf = django_field_to_schema(f)
            sf.show_in_list = (f.name in cls.list_display) if cls.list_display else True
            sf.searchable = f.name in cls.search_fields
            introspected.append(sf)

        # ── Serializer fields ─────────────────────────────────────────────
        if getattr(cls, "read_serializer_class", None):
            serializer = cls.read_serializer_class()
            existing = {f.name: f for f in introspected}

            for name, ser_field in serializer.fields.items():
                if name in cls.exclude:
                    continue
                if name in existing:
                    existing[name].read_only = ser_field.read_only
                    existing[name].required = ser_field.required
                    continue

                inferred_type, choices, is_multiple = _drf_field_to_type(ser_field)
                if inferred_type is None:
                    continue

                # ── Relation fields ────────────────────────────────────────
                if inferred_type == "relation":
                    related_model = None
                    if isinstance(ser_field, drf_serializers.ManyRelatedField):
                        if hasattr(ser_field, 'child_relation') and ser_field.child_relation.queryset is not None:
                            related_model = ser_field.child_relation.queryset.model
                    elif hasattr(ser_field, "queryset") and ser_field.queryset is not None:
                        related_model = ser_field.queryset.model

                    if related_model:
                        qualified = f"{related_model._meta.app_label}.{related_model.__name__}"
                        schema_cls = registry.get(qualified)
                        endpoint = schema_cls.endpoint if schema_cls else _fallback_endpoint(related_model)
                        introspected.append(
                            SchemaField(
                                name=name,
                                type="relation",
                                read_only=ser_field.read_only,
                                required=ser_field.required,
                                multiple=is_multiple,
                                related_model=related_model.__name__,
                                related_model_qualified_name=qualified,
                                related_endpoint=endpoint,
                                show_in_list=(name in cls.list_display) if cls.list_display else False,
                                searchable=name in cls.search_fields,
                            )
                        )
                    else:
                        # Still expose as relation, even without known model
                        introspected.append(
                            SchemaField(
                                name=name,
                                type="relation",
                                read_only=ser_field.read_only,
                                required=ser_field.required,
                                multiple=is_multiple,
                                show_in_list=(name in cls.list_display) if cls.list_display else False,
                                searchable=name in cls.search_fields,
                            )
                        )
                    continue

                # ── Nested / nested_list fields ────────────────────────────
                nested_fields: list[dict] = []
                if inferred_type in ("nested", "nested_list"):
                    inner = ser_field.child if isinstance(ser_field, drf_serializers.ListSerializer) else ser_field
                    nested_fields = _nested_fields_from_serializer(inner)

                nested_related_qualified = None
                if inferred_type == "nested_list":
                    child_serializer = ser_field.child if isinstance(ser_field, drf_serializers.ListSerializer) else ser_field
                    if hasattr(child_serializer, 'Meta') and hasattr(child_serializer.Meta, 'model'):
                        nested_related_qualified = f"{child_serializer.Meta.model._meta.app_label}.{child_serializer.Meta.model.__name__}"
                elif inferred_type == "nested":
                    if hasattr(ser_field, 'Meta') and hasattr(ser_field.Meta, 'model'):
                        nested_related_qualified = f"{ser_field.Meta.model._meta.app_label}.{ser_field.Meta.model.__name__}"

                introspected.append(
                    SchemaField(
                        name=name,
                        type=inferred_type,
                        read_only=ser_field.read_only,
                        required=ser_field.required,
                        choices=choices or [],
                        multiple=is_multiple,
                        nested_fields=nested_fields,
                        related_model_qualified_name=nested_related_qualified,
                        show_in_list=(name in cls.list_display) if cls.list_display else False,
                        searchable=name in cls.search_fields,
                    )
                )

        return introspected

    @classmethod
    def to_dict(cls) -> dict:
        fields = cls.get_fields()
        list_fields = [f.name for f in fields if f.show_in_list] or [f.name for f in fields]
        return {
            "name": cls.get_name(),
            "endpoint": cls.endpoint,
            "list_display": list_fields,
            "search_fields": cls.search_fields,
            "ordering": cls.ordering,
            "fields": [f.to_dict() for f in fields],
            "use_explicit_viewset": cls.use_explicit_viewset,
        }