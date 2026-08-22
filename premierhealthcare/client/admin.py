from django.contrib import admin
from .models import OfflineConversion


@admin.register(OfflineConversion)
class OfflineConversionAdmin(admin.ModelAdmin):
    list_display = ["booking", "event_name", "status", "value", "currency", "conversion_time"]
    list_filter = ["event_name", "status"]
    search_fields = ["booking__id", "gclid", "fbclid"]
    readonly_fields = ["conversion_time", "created_at"]
