"""
On-demand public content translation.

Features:
- English source content
- LibreTranslate backend
- Durable translation queue
- Cached translations
- Chunked translation
- Protected medical/brand terminology
- Placeholder validation
- Retry support
- Public API payload localization
"""

import hashlib
import re
import threading

import requests

from django.apps import apps
from django.conf import settings
from django.utils import timezone


# =============================================================================
# SUPPORTED LANGUAGES
# =============================================================================

LANGUAGES = (
    "en",
    "ar",
    "fr",
    "de",
    "es",
    "it",
    "tr",
    "ru",
)


# =============================================================================
# CONTENT FIELDS
# =============================================================================

CONTENT_FIELDS = {
    "Department": (
        "name",
        "description",
    ),

    "Service": (
        "name",
        "description",
    ),

    "Branch": (
        "name",
        "address",
        "city",
    ),

    "Doctor": (
        "specialization",
        "position",
        "bio",
        "languages",
    ),

    "Gallery": (
        "title",
        "description",
    ),

    "BranchGallery": (
        "title",
        "description",
    ),

    "Testimonial": (
        "role",
        "text",
    ),

    "IVDripPage": (
        "title",
        "short_description",
    ),

    "IVBenefit": (
        "title",
        "description",
    ),

    "IVAdministrationStep": (
        "title",
        "description",
    ),

    "IVDripProduct": (
        "who_is_it_for",
        "how_it_helps",
        "key_ingredients",
        "perfect_pairings",
        "name",
        "tagline",
        "short_description",
        "full_description",
        "meta_title",
        "meta_description",
    ),

    "IVDripFAQ": (
        "question",
        "answer",
    ),

    "ArticlesPage": (
        "title",
        "short_description",
    ),

    "ArticleCategory": (
        "name",
    ),

    "Article": (
        "title",
        "excerpt",
        "content",
        "tags",
        "meta_title",
        "meta_description",
    ),
}


# =============================================================================
# PUBLIC RESPONSE TRANSLATION
# =============================================================================
#
# Only these response keys are translated.
# IDs, slugs, URLs, prices, dates, codes, etc. remain unchanged.
#

PUBLIC_TEXT_KEYS = {
    "whoIsItFor",
    "howItHelps",
    "keyIngredients",
    "perfectPairings",

    "name",
    "title",
    "description",

    "shortDescription",
    "short_description",

    "fullDescription",
    "full_description",

    "tagline",

    "question",
    "answer",

    "excerpt",
    "content",

    "metaTitle",
    "meta_title",

    "metaDescription",
    "meta_description",

    "bio",

    "specialization",
    "specialty",
    "position",

    "languages",

    "address",
    "city",

    "department_name",
    "branch_name",
    "service_name",

    "role",
    "text",
    "tags",
    "service_names",
}


# =============================================================================
# PUBLIC API ROUTES
# =============================================================================

PUBLIC_ROUTES = {
    "iv-drip-therapy-page",
    "iv-drip-therapy-detail",

    "articles-list",
    "article-detail",
    "article-categories",

    "wizard-departments",
    "wizard-services",
    "wizard-branches",
    "wizard-doctors",

    "branches",
    "doctors",

    "departments",

    "doctor-detail-direct",
    "doctor-details",

    "services",

    "service-detail",
    "service-detail-legacy",

    "gallery-list",
    "branch-gallery-public-list",
    "testimonial-public-list",
}


# =============================================================================
# TRANSLATION-FIELD HELPER
# =============================================================================

def is_translation_field(name: str) -> bool:
    return any(
        name.endswith(f"_{language}")
        for language in LANGUAGES
        if language != "en"
    )


# =============================================================================
# PROTECTED TERMS
# =============================================================================

PROTECTED_TERMS = [
    "Premier Health Clinics",
    "Premier Healthcare",
    "Premier Health",
    "IV Drip Therapy",
    "IV Drip",
    "IV Therapy",
    "Paymob",
    "Cloudinary",
    "Novax",
]


_SORTED_TERMS = sorted(
    PROTECTED_TERMS,
    key=len,
    reverse=True,
)


# =============================================================================
# PROTECTED PLACEHOLDER
# =============================================================================
#
# Do NOT use __T0__, __T1__, etc.
# LibreTranslate may modify those.
#

_PH = "ZXQPROTECTED{i}QXZ"


# =============================================================================
# PLACEHOLDER PROTECTION
# =============================================================================

def _protect(text: str):
    """
    Replace protected medical/brand terms with safe placeholders.
    """

    restore = {}
    counter = 0

    for term in _SORTED_TERMS:

        pattern = re.compile(
            re.escape(term),
            re.IGNORECASE,
        )

        def replace(match):
            nonlocal counter

            placeholder = _PH.format(
                i=counter
            )

            counter += 1

            restore[
                placeholder
            ] = match.group(0)

            return placeholder

        text = pattern.sub(
            replace,
            text,
        )

    return text, restore


def _restore(
    text: str,
    restore: dict,
) -> str:

    for placeholder, original in restore.items():
        text = text.replace(
            placeholder,
            original,
        )

    return text


# =============================================================================
# CHUNKING
# =============================================================================

MAX_CHUNK = 3000


def _chunk_text(text: str) -> list[str]:

    paragraphs = re.split(
        r"\n{2,}",
        text.strip(),
    )

    chunks = []

    current = []
    current_length = 0

    for paragraph in paragraphs:

        paragraph_length = (
            len(paragraph) + 2
        )

        if (
            current
            and
            current_length
            + paragraph_length
            > MAX_CHUNK
        ):

            chunks.append(
                "\n\n".join(current)
            )

            current = [
                paragraph
            ]

            current_length = len(
                paragraph
            )

        else:

            current.append(
                paragraph
            )

            current_length += (
                paragraph_length
            )

    if current:

        chunks.append(
            "\n\n".join(current)
        )

    return chunks or [text]


def _chunk_html(html: str) -> list[str]:

    from bs4 import BeautifulSoup

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    chunks = []

    current = []
    current_length = 0

    for element in soup.children:

        rendered = str(element)

        if (
            current
            and
            current_length
            + len(rendered)
            > MAX_CHUNK
        ):

            chunks.append(
                "".join(current)
            )

            current = [
                rendered
            ]

            current_length = len(
                rendered
            )

        else:

            current.append(
                rendered
            )

            current_length += len(
                rendered
            )

    if current:

        chunks.append(
            "".join(current)
        )

    return chunks or [html]


# =============================================================================
# HELPERS
# =============================================================================

def model():

    return apps.get_model(
        "client",
        "ContentTranslation",
    )


def text_format(
    text: str,
) -> str:

    return (
        "html"
        if re.search(
            r"</?[a-zA-Z][^>]*>",
            text,
        )
        else "text"
    )


# =============================================================================
# TRANSLATION CACHE VERSION
# =============================================================================
#
# Changing this invalidates old fingerprints.
#

TRANSLATION_CACHE_VERSION = "v3"


def fingerprint(
    text: str,
) -> str:

    value = (
        TRANSLATION_CACHE_VERSION
        + "\0"
        + text_format(text)
        + "\0"
        + text
    )

    return hashlib.sha256(
        value.encode()
    ).hexdigest()


# =============================================================================
# PROTECTED SEGMENT TRANSLATION
# =============================================================================

def _split_protected_segments(text: str):

    if not text:
        return [
            ("text", text)
        ]

    pattern = re.compile(
        "("
        + "|".join(
            re.escape(term)
            for term in _SORTED_TERMS
        )
        + ")",
        re.IGNORECASE,
    )

    parts = []
    last = 0

    for match in pattern.finditer(
        text
    ):

        if match.start() > last:

            parts.append(
                (
                    "text",
                    text[
                        last:
                        match.start()
                    ],
                )
            )

        parts.append(
            (
                "protected",
                match.group(0),
            )
        )

        last = match.end()

    if last < len(text):

        parts.append(
            (
                "text",
                text[last:],
            )
        )

    return parts or [
        ("text", text)
    ]


def _translate_preserving_terms(
    text: str,
    target_language: str,
    text_format_value: str,
    api_url: str,
    base: dict,
) -> str:

    segments = _split_protected_segments(
        text
    )

    output = []

    for kind, value in segments:

        if kind == "protected":

            output.append(
                value
            )

            continue

        if not value.strip():

            output.append(
                value
            )

            continue

        chunks = (
            _chunk_html(value)
            if text_format_value == "html"
            else _chunk_text(value)
        )

        for chunk in chunks:

            response = requests.post(
                api_url,
                json={
                    **base,
                    "q": chunk,
                    "format": text_format_value,
                },
                timeout=(
                    5,
                    90,
                ),
            )

            response.raise_for_status()

            translated = (
                response.json()
                .get(
                    "translatedText"
                )
            )

            if not (
                isinstance(
                    translated,
                    str,
                )
                and translated.strip()
            ):

                raise ValueError(
                    "Empty translation from provider"
                )

            output.append(
                translated
            )

    return "".join(output)


# =============================================================================
# QUEUE
# =============================================================================

def queue_texts(
    texts,
    languages=LANGUAGES[1:],
):

    values = {
        text
        for text in texts
        if (
            isinstance(
                text,
                str,
            )
            and text.strip()
        )
    }

    if not values:
        return

    fingerprints = {
        text: fingerprint(text)
        for text in values
    }

    Translation = model()

    existing = set(
        Translation.objects.filter(
            source_hash__in=(
                fingerprints.values()
            )
        ).values_list(
            "source_hash",
            "target_language",
        )
    )

    rows = []

    for text in values:

        source_hash = fingerprints[
            text
        ]

        for language in languages:

            if language not in LANGUAGES:
                continue

            if language == "en":
                continue

            if (
                source_hash,
                language,
            ) in existing:
                continue

            rows.append(
                Translation(
                    source_hash=source_hash,
                    source_text=text,
                    text_format=text_format(
                        text
                    ),
                    target_language=language,
                    status="pending",
                )
            )

    if rows:

        Translation.objects.bulk_create(
            rows,
            ignore_conflicts=True,
        )


# =============================================================================
# INSTANCE QUEUE
# =============================================================================

def queue_instance(instance):

    texts = []

    fields = CONTENT_FIELDS.get(
        type(instance).__name__,
        (),
    )

    for field in fields:

        value = getattr(
            instance,
            field,
            None,
        )

        if isinstance(
            value,
            list,
        ):

            texts.extend(
                value
            )

        else:

            texts.append(
                value
            )

    queue_texts(
        texts
    )


# =============================================================================
# HEADER LANGUAGE PARSER
# =============================================================================

def locale_from_header(
    header: str,
) -> str:

    choices = []

    for position, token in enumerate(
        (header or "en").split(",")
    ):

        parts = token.strip().split(
            ";"
        )

        language = (
            parts[0]
            .lower()
            .split("-")[0]
        )

        try:

            quality = next(
                (
                    float(
                        part.strip()[2:]
                    )
                    for part in parts[1:]
                    if part.strip().startswith(
                        "q="
                    )
                ),
                1.0,
            )

        except ValueError:

            quality = 0

        if (
            language in LANGUAGES
            and quality > 0
        ):

            choices.append(
                (
                    quality,
                    -position,
                    language,
                )
            )

    if not choices:
        return "en"

    return max(
        choices
    )[2]


# =============================================================================
# PUBLIC PAYLOAD LOCALIZATION
# =============================================================================

def translate_text(text, locale):
    """
    Translate one English string on demand.
    Nothing is persisted to the database.
    """
    if locale == "en":
        return text

    if not isinstance(text, str) or not text.strip():
        return text

    # Don't send already-Arabic text back through English -> Arabic.
    if locale == "ar" and re.search(r"[\u0600-\u06FF]", text):
        return text

    url = settings.CONTENT_TRANSLATION_URL.rstrip("/") + "/translate"

    payload = {
        "q": text,
        "source": "en",
        "target": locale,
        "format": text_format(text),
    }

    api_key = getattr(
        settings,
        "CONTENT_TRANSLATION_API_KEY",
        "",
    )

    if api_key:
        payload["api_key"] = api_key

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=(3, 30),
        )

        response.raise_for_status()

        translated = response.json().get("translatedText")

        if (
            not isinstance(translated, str)
            or not translated.strip()
        ):
            return text

        # Provider returned the original text unchanged.
        if translated.strip().casefold() == text.strip().casefold():
            return text

        return translated

    except requests.RequestException:
        return text
    except (ValueError, TypeError):
        return text


def localize_payload(payload, locale):
    """
    Translate public API payload on demand.

    No ContentTranslation rows are created.
    No translation is persisted.
    """

    if locale == "en":
        return payload, 0

    # Deduplicate strings so the same value is translated once per request.
    unique_texts = []

    def collect(value):
        if isinstance(value, dict):
            for key, item in value.items():

                if (
                    key in PUBLIC_TEXT_KEYS
                    and isinstance(item, str)
                    and item.strip()
                ):
                    if item not in unique_texts:
                        unique_texts.append(item)

                elif (
                    key in PUBLIC_TEXT_KEYS
                    and isinstance(item, list)
                ):
                    for x in item:
                        if (
                            isinstance(x, str)
                            and x.strip()
                            and x not in unique_texts
                        ):
                            unique_texts.append(x)

                if isinstance(item, (dict, list)):
                    collect(item)

        elif isinstance(value, list):
            for item in value:
                collect(item)

    collect(payload)

    if not unique_texts:
        return payload, 0

    translated_map = {}

    for text in unique_texts:
        translated_map[text] = translate_text(
            text,
            locale,
        )

    missing = 0

    for source, translated in translated_map.items():
        if translated == source:
            missing += 1

    def walk(value):
        if isinstance(value, list):
            return [walk(item) for item in value]

        if not isinstance(value, dict):
            return value

        result = {}

        for key, item in value.items():

            if (
                key in PUBLIC_TEXT_KEYS
                and isinstance(item, str)
            ):
                result[key] = translated_map.get(
                    item,
                    item,
                )

            elif (
                key in PUBLIC_TEXT_KEYS
                and isinstance(item, list)
            ):
                result[key] = [
                    translated_map.get(x, x)
                    if isinstance(x, str)
                    else walk(x)
                    for x in item
                ]

            else:
                result[key] = walk(item)

        return result

    return walk(payload), missing

    def translated(text):

        nonlocal missing

        if not text.strip():
            return text

        result = cached.get(
            fingerprint(text)
        )

        if result:
            return result

        missing += 1

        return text

    def walk(value):

        if isinstance(
            value,
            list,
        ):

            return [
                walk(item)
                for item in value
            ]

        if not isinstance(
            value,
            dict,
        ):

            return value

        result = {
            key: walk(item)
            for key, item in value.items()
        }

        for key, item in value.items():

            if (
                key in PUBLIC_TEXT_KEYS
                and isinstance(
                    item,
                    str,
                )
            ):

                result[key] = translated(
                    item
                )

                # Keep Arabic compatibility fields.
                if locale == "ar":

                    result[
                        key + "_ar"
                    ] = result[key]

            elif (
                key in PUBLIC_TEXT_KEYS
                and isinstance(
                    item,
                    list,
                )
            ):

                result[key] = [
                    translated(x)
                    if isinstance(
                        x,
                        str,
                    )
                    else walk(x)
                    for x in item
                ]

        return result

    return (
        walk(payload),
        missing,
    )


# =============================================================================
# BACKGROUND LOCK
# =============================================================================

_translate_lock = threading.Lock()


def _drain_queue():

    if not _translate_lock.acquire(
        blocking=False
    ):

        return

    try:

        translate_pending(
            limit=20
        )

    finally:

        _translate_lock.release()


# =============================================================================
# TRANSLATION WORKER
# =============================================================================

def translate_pending(
    limit=20,
):

    from datetime import timedelta
    from django.db.models import Q

    retry_before = (
        timezone.now()
        - timedelta(
            seconds=60
        )
    )

    Translation = model()

    jobs = (
        Translation.objects.filter(
            Q(
                status="pending"
            )
            |
            Q(
                status="error",
                updated_at__lt=retry_before,
            )
        )
        .order_by("id")[
            :limit
        ]
    )

    successes = 0
    failures = 0

    for job in jobs:

        try:

            api_url = (
                settings.CONTENT_TRANSLATION_URL
                .rstrip("/")
                + "/translate"
            )

            api_key = getattr(
                settings,
                "CONTENT_TRANSLATION_API_KEY",
                "",
            )

            base = {
                "source": "en",
                "target": job.target_language,
            }

            if api_key:

                base[
                    "api_key"
                ] = api_key

            # ---------------------------------------------------------
            # Protect medical / brand terms
            # ---------------------------------------------------------

            protected, restore_map = _protect(
                job.source_text
            )

            # ---------------------------------------------------------
            # Chunk
            # ---------------------------------------------------------

            if job.text_format == "html":

                chunks = _chunk_html(
                    protected
                )

            else:

                chunks = _chunk_text(
                    protected
                )

            translated_chunks = []

            # ---------------------------------------------------------
            # LibreTranslate
            # ---------------------------------------------------------

            for chunk in chunks:

                response = requests.post(
                    api_url,
                    json={
                        **base,
                        "q": chunk,
                        "format": job.text_format,
                    },
                    timeout=(
                        5,
                        90,
                    ),
                )

                response.raise_for_status()

                translated = (
                    response.json()
                    .get(
                        "translatedText"
                    )
                )

                if not (
                    isinstance(
                        translated,
                        str,
                    )
                    and translated.strip()
                ):

                    raise ValueError(
                        "Empty translation from provider"
                    )

                translated_chunks.append(
                    translated
                )

            # ---------------------------------------------------------
            # Join chunks
            # ---------------------------------------------------------

            separator = (
                ""
                if job.text_format == "html"
                else "\n\n"
            )

            translated = separator.join(
                translated_chunks
            )

            # ---------------------------------------------------------
            # Validate protected placeholders
            # ---------------------------------------------------------

            for placeholder in restore_map:

                if (
                    translated.count(
                        placeholder
                    )
                    != 1
                ):

                    raise ValueError(
                        "Protected placeholder "
                        "was modified or removed: "
                        + placeholder
                    )

            # ---------------------------------------------------------
            # Restore protected terms
            # ---------------------------------------------------------

            translated = _restore(
                translated,
                restore_map,
            )

            job.translated_text = translated

            job.status = "ready"

            job.last_error = ""

            successes += 1

        except requests.RequestException as exc:

            job.status = "error"

            job.last_error = (
                type(exc).__name__
            )

            failures += 1

        except (
            ValueError,
            TypeError,
            AttributeError,
        ) as exc:

            job.status = "error"

            job.last_error = str(
                exc
            )[:250]

            failures += 1

        job.attempts += 1

        job.save(
            update_fields=[
                "translated_text",
                "status",
                "last_error",
                "attempts",
                "updated_at",
            ]
        )

        # Stop if LibreTranslate itself is failing.
        if failures:
            break

    return (
        successes,
        failures,
    )
