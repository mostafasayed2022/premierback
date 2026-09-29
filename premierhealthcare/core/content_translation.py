"""
On-demand public content translation.

Features:
- English source content
- LibreTranslate backend
- Translation cache
- Chunked translation
- Protected medical/brand terminology
- Placeholder validation
- Retry support
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


# IMPORTANT:
# Do NOT use __T0__ / __T1__.
# LibreTranslate may alter those.
#
# This token is designed to survive translation.
_PH = "ZXQPROTECTED{i}QXZ"


# =============================================================================
# PLACEHOLDER PROTECTION
# =============================================================================

def _protect(text: str):
    """
    Replace protected terms with translation-safe placeholders.

    Example:

        Premier Health Clinics

    becomes:

        ZXQPROTECTED0QXZ
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


# Changing this invalidates ALL old fingerprints.
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


def _split_protected_segments(text: str):
    """
    Split text into:
      ("text", normal text)
      ("protected", original protected term)

    Protected terms are NEVER sent to LibreTranslate.
    """
    if not text:
        return [("text", text)]

    pattern = re.compile(
        "(" + "|".join(
            re.escape(term)
            for term in _SORTED_TERMS
        ) + ")",
        re.IGNORECASE,
    )

    parts = []
    last = 0

    for match in pattern.finditer(text):
        if match.start() > last:
            parts.append(
                ("text", text[last:match.start()])
            )

        parts.append(
            ("protected", match.group(0))
        )

        last = match.end()

    if last < len(text):
        parts.append(
            ("text", text[last:])
        )

    return parts or [("text", text)]


def _translate_preserving_terms(
    text: str,
    target_language: str,
    text_format_value: str,
    api_url: str,
    base: dict,
) -> str:
    """
    Translate only non-protected segments.

    Protected brand/medical terms are inserted back unchanged.
    """

    segments = _split_protected_segments(text)

    output = []

    for kind, value in segments:

        if kind == "protected":
            output.append(value)
            continue

        if not value.strip():
            output.append(value)
            continue

        for chunk in (
            _chunk_html(value)
            if text_format_value == "html"
            else _chunk_text(value)
        ):
            response = requests.post(
                api_url,
                json={
                    **base,
                    "q": chunk,
                    "format": text_format_value,
                },
                timeout=(5, 90),
            )

            response.raise_for_status()

            translated = response.json().get(
                "translatedText"
            )

            if not (
                isinstance(translated, str)
                and translated.strip()
            ):
                raise ValueError(
                    "Empty translation from provider"
                )

            output.append(translated)

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
            isinstance(text, str)
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

        if isinstance(value, list):
            texts.extend(value)

        else:
            texts.append(value)

    queue_texts(texts)


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
            Q(status="pending")
            |
            Q(
                status="error",
                updated_at__lt=retry_before,
            )
        )
        .order_by("id")[:limit]
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
                base["api_key"] = api_key

            # -----------------------------------------------------------
            # Protect brand/medical terms
            # -----------------------------------------------------------

            protected, restore_map = _protect(
                job.source_text
            )

            # -----------------------------------------------------------
            # Chunk
            # -----------------------------------------------------------

            if job.text_format == "html":
                chunks = _chunk_html(
                    protected
                )
            else:
                chunks = _chunk_text(
                    protected
                )

            translated_chunks = []

            # -----------------------------------------------------------
            # LibreTranslate
            # -----------------------------------------------------------

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
                    .get("translatedText")
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

            # -----------------------------------------------------------
            # Join chunks
            # -----------------------------------------------------------

            separator = (
                ""
                if job.text_format == "html"
                else "\n\n"
            )

            translated = separator.join(
                translated_chunks
            )

            # -----------------------------------------------------------
            # CRITICAL:
            # Every protected placeholder must survive.
            # -----------------------------------------------------------

            for placeholder in restore_map:

                # Exactly once.
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

            # -----------------------------------------------------------
            # Restore original terms
            # -----------------------------------------------------------

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

            job.last_error = str(exc)[
                :250
            ]

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

        # Stop after first failure so we don't
        # hammer LibreTranslate when it is broken.
        if failures:
            break

    return (
        successes,
        failures,
    )
