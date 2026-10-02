from django.apps import apps

from core.content_translation import (
    LANGUAGES,
    fingerprint,
    queue_texts,
    _drain_queue,
    locale_from_header,
)


class TranslatableSerializerMixin:
    translatable_fields: list[str] = []
    source_language: str = "en"

    def get_language(self) -> str:
        request = self.context.get("request")

        if not request:
            return self.source_language

        lang = (
            request.query_params.get("lang")
            or ""
        ).strip().lower()

        if not lang:
            lang = locale_from_header(
                request.headers.get(
                    "Accept-Language",
                    "",
                )
            )

        lang = lang.split("-")[0].strip()

        if lang not in LANGUAGES:
            return self.source_language

        return lang

    def to_representation(self, instance):
        return super().to_representation(instance)
