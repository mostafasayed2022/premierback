from django.apps import apps

from core.content_translation import (
    LANGUAGES,
    fingerprint,
    queue_texts,
    _drain_queue,
    locale_from_header,
)


class TranslatableSerializerMixin:
    """
    Public API translation layer.

    English is the source language.

    Language priority:
        1. ?lang=xx
        2. Accept-Language: xx

    Translation behavior:
        - English: return database content directly.
        - Arabic: use manually stored *_ar when available.
        - Missing translation: queue it.
        - Ready translation: return immediately.
        - Missing translation: return English for this request,
          then translate it in the background.
    """

    translatable_fields: list[str] = []
    source_language: str = "en"

    def get_language(self) -> str:
        request = self.context.get("request")

        if not request:
            return self.source_language

        # ---------------------------------------------------------------
        # 1. Explicit ?lang=xx
        # ---------------------------------------------------------------
        lang = (
            request.query_params.get("lang")
            or ""
        ).strip().lower()

        # ---------------------------------------------------------------
        # 2. Frontend Accept-Language
        # ---------------------------------------------------------------
        if not lang:
            lang = locale_from_header(
                request.headers.get(
                    "Accept-Language",
                    "",
                )
            )

        # ar-EG -> ar
        lang = lang.split("-")[0].strip()

        if lang not in LANGUAGES:
            return self.source_language

        return lang

    @staticmethod
    def arabic_key(field_name: str) -> str:
        """
        Convert:
            title           -> title_ar
            shortDescription -> shortDescription_ar
            metaTitle       -> metaTitle_ar
        """
        return f"{field_name}_ar"

    def to_representation(self, instance):
        data = super().to_representation(instance)

        lang = self.get_language()

        # English = source language, nothing to translate.
        if lang == self.source_language:
            return data

        Translation = apps.get_model(
            "client",
            "ContentTranslation",
        )

        string_fields: dict[str, str] = {}
        list_fields: dict[str, list[str]] = {}

        # ===============================================================
        # Collect fields that need translation
        # ===============================================================

        for field_name in self.translatable_fields:
            value = data.get(field_name)

            # -----------------------------------------------------------
            # Arabic manually curated content wins.
            # Example:
            # title_ar
            # description_ar
            # content_ar
            # -----------------------------------------------------------
            if lang == "ar":
                arabic_key = self.arabic_key(
                    field_name
                )

                curated = data.get(
                    arabic_key
                )

                if (
                    isinstance(curated, str)
                    and curated.strip()
                ):
                    data[field_name] = curated
                    continue

            # -----------------------------------------------------------
            # Normal string
            # -----------------------------------------------------------
            if (
                isinstance(value, str)
                and value.strip()
            ):
                string_fields[field_name] = value

            # -----------------------------------------------------------
            # JSON/list field
            # Example: tags / languages
            # -----------------------------------------------------------
            elif isinstance(value, list):
                values = [
                    item
                    for item in value
                    if (
                        isinstance(item, str)
                        and item.strip()
                    )
                ]

                if values:
                    list_fields[field_name] = values

        all_texts = (
            list(string_fields.values())
            + [
                item
                for values in list_fields.values()
                for item in values
            ]
        )

        if not all_texts:
            return data

        # ===============================================================
        # Queue ONLY the language currently requested
        # ===============================================================

        queue_texts(
            all_texts,
            languages=[lang],
        )

        # ===============================================================
        # Read completed translations
        # ===============================================================

        fingerprints = {
            text: fingerprint(text)
            for text in all_texts
        }

        cached = dict(
            Translation.objects.filter(
                source_hash__in=fingerprints.values(),
                target_language=lang,
                status="ready",
            ).values_list(
                "source_hash",
                "translated_text",
            )
        )

        missing = False

        # ===============================================================
        # String fields
        # ===============================================================

        for field_name, source_text in string_fields.items():
            source_hash = fingerprints[source_text]

            translated = cached.get(
                source_hash
            )

            if translated:
                data[field_name] = translated

                # Arabic frontend compatibility:
                # title -> title_ar
                # content -> content_ar
                if lang == "ar":
                    arabic_key = self.arabic_key(
                        field_name
                    )

                    if not data.get(arabic_key):
                        data[arabic_key] = translated

            else:
                # Translation not ready yet.
                # Keep source language for this request.
                missing = True

        # ===============================================================
        # List fields
        # ===============================================================

        for field_name in list_fields:
            original_values = data.get(
                field_name,
                [],
            )

            translated_values = []

            for item in original_values:

                if not (
                    isinstance(item, str)
                    and item.strip()
                ):
                    translated_values.append(
                        item
                    )
                    continue

                source_hash = fingerprints.get(
                    item
                )

                translated = (
                    cached.get(source_hash)
                    if source_hash
                    else None
                )

                if translated:
                    translated_values.append(
                        translated
                    )
                else:
                    translated_values.append(
                        item
                    )
                    missing = True

            data[field_name] = translated_values

        # ===============================================================
        # Background generation
        # ===============================================================

        if missing:
            import threading

            threading.Thread(
                target=_drain_queue,
                daemon=True,
            ).start()

        return data
