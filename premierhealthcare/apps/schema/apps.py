from django.apps import AppConfig


# class SchemaConfig(AppConfig):
#     default_auto_field = "django.db.models.BigAutoField"
#     name = "apps.schema"

#     def ready(self):
#         # Trigger autodiscovery of all admin_schema.py modules
#         # across all installed apps. This mirrors Django admin's
#         # autodiscover() behavior — decorators self-register.
#         from .registry import registry
#         registry.autodiscover()

#         from django.apps import AppConfig


# class CoSchemaConfigreConfig(AppConfig):
#     name = "apps.schema"
#     default_auto_field = "django.db.models.BigAutoField"

#     def ready(self):
#         """
#         Called exactly once after Django's app registry is fully loaded.
#         Safe to import models, registries, and signals here.

#         Execution order:
#           1. autodiscover() — imports each app's admin_schema.py,
#              triggering @registry.register decorators for explicit schemas.
#           2. auto_register_all_models() — generates default schemas for any
#              model that wasn't explicitly registered in step 1.

#         This is the ONLY place these two methods should be called.
#         urls.py calls _build_dynamic_router() AFTER this, so the registry
#         is already fully populated when the router walks it.
#         """
#         from apps.schema.registry import registry

#         registry.autodiscover()
#         registry.auto_register_all_models()

#         from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "apps.schema"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        """
        Called exactly once after Django's app registry is fully loaded.
        Safe to import models, registries, and signals here.

        Execution order:
          1. autodiscover() — imports each app's admin_schema.py,
             triggering @registry.register decorators for explicit schemas.
          2. auto_register_all_models() — generates default schemas for any
             model that wasn't explicitly registered in step 1.

        This is the ONLY place these two methods should be called.
        urls.py calls _build_dynamic_router() AFTER this, so the registry
        is already fully populated when the router walks it.
        """
        from apps.schema.registry import registry

        registry.autodiscover()
        registry.auto_register_all_models()