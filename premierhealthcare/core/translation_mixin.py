import threading
from django.apps import apps
from core.content_translation import LANGUAGES, fingerprint, queue_texts, _drain_queue


class TranslatableSerializerMixin:
    translatable_fields: list[str] = []
    source_language: str = "en"

    def get_language(self) -> str:
        request = self.context.get("request")
        if not request:
            return self.source_language
        lang = (request.query_params.get("lang") or "").lower().strip()
        return lang if lang in LANGUAGES else self.source_language

    def to_representation(self, instance):
        data = super().to_representation(instance)
        lang = self.get_language()
        if lang == self.source_language:
            return data

        M = apps.get_model("client", "ContentTranslation")

        str_fields: dict[str, str] = {}
        list_fields: dict[str, list] = {}

        for field_name in self.translatable_fields:
            value = data.get(field_name)

            if lang == "ar":
                curated = data.get(field_name + "_ar")
                if curated and isinstance(curated, str) and curated.strip():
                    data[field_name] = curated
                    continue

            if isinstance(value, str) and value.strip():
                str_fields[field_name] = value
            elif isinstance(value, list):
                texts = [x for x in value if isinstance(x, str) and x.strip()]
                if texts:
                    list_fields[field_name] = texts

        all_texts = list(str_fields.values()) + [
            t for ts in list_fields.values() for t in ts
        ]
        if not all_texts:
            return data

        queue_texts(all_texts, languages=[lang])

        fps = {t: fingerprint(t) for t in all_texts}
        cached = dict(
            M.objects.filter(
                source_hash__in=fps.values(),
                target_language=lang,
                status="ready",
            ).values_list("source_hash", "translated_text")
        )

        missing = False

        for field_name, text in str_fields.items():
            h = fps[text]
            if h in cached:
                data[field_name] = cached[h]
                if lang == "ar" and not data.get(field_name + "_ar"):
                    data[field_name + "_ar"] = cached[h]
            else:
                missing = True

        for field_name, _texts in list_fields.items():
            result = []
            for item in data.get(field_name, []):
                if isinstance(item, str) and item.strip():
                    h = fps.get(item)
                    translated = cached.get(h) if h else None
                    result.append(translated if translated else item)
                    if not translated:
                        missing = True
                else:
                    result.append(item)
            data[field_name] = result

        if missing:
            threading.Thread(target=_drain_queue, daemon=True).start()

        return data
