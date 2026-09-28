"""Translation queue, cache, brand protection, chunked worker."""
import hashlib
import re
import threading
from django.apps import apps
from django.conf import settings
from django.utils import timezone
import requests

LANGUAGES = ("en", "ar", "fr", "de", "es", "it", "tr", "ru")

CONTENT_FIELDS = {
    "Department": ("name", "description"),
    "Service": ("name", "description"),
    "Branch": ("name", "address", "city"),
    "Doctor": ("specialization", "position", "bio", "languages"),
    "Gallery": ("title", "description"),
    "BranchGallery": ("title", "description"),
    "Testimonial": ("role", "text"),
    "IVDripPage": ("title", "short_description"),
    "IVBenefit": ("title", "description"),
    "IVAdministrationStep": ("title", "description"),
    "IVDripProduct": (
        "who_is_it_for", "how_it_helps", "key_ingredients", "perfect_pairings",
        "name", "tagline", "short_description", "full_description",
        "meta_title", "meta_description",
    ),
    "IVDripFAQ": ("question", "answer"),
    "ArticlesPage": ("title", "short_description"),
    "ArticleCategory": ("name",),
    "Article": ("title", "excerpt", "content", "tags", "meta_title", "meta_description"),
}

# ── Brand protection ──────────────────────────────────────────────────────────

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
_SORTED_TERMS = sorted(PROTECTED_TERMS, key=len, reverse=True)
_PH = "__T{i}__"


def _protect(text: str):
    restore: dict[str, str] = {}
    for i, term in enumerate(_SORTED_TERMS):
        ph = _PH.format(i=i)
        def _sub(m, ph=ph):
            restore[ph] = m.group(0)
            return ph
        text = re.compile(re.escape(term), re.IGNORECASE).sub(_sub, text)
    return text, restore


def _restore(text: str, restore: dict) -> str:
    for ph, original in restore.items():
        text = text.replace(ph, original)
    return text


# ── Chunking ──────────────────────────────────────────────────────────────────

MAX_CHUNK = 3000


def _chunk_text(text: str) -> list[str]:
    paras = re.split(r"\n{2,}", text.strip())
    chunks, cur, cur_len = [], [], 0
    for p in paras:
        if cur and cur_len + len(p) + 2 > MAX_CHUNK:
            chunks.append("\n\n".join(cur))
            cur, cur_len = [p], len(p)
        else:
            cur.append(p)
            cur_len += len(p) + 2
    if cur:
        chunks.append("\n\n".join(cur))
    return chunks or [text]


def _chunk_html(html: str) -> list[str]:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")
    chunks, cur, cur_len = [], [], 0
    for el in soup.children:
        s = str(el)
        if cur and cur_len + len(s) > MAX_CHUNK:
            chunks.append("".join(cur))
            cur, cur_len = [s], len(s)
        else:
            cur.append(s)
            cur_len += len(s)
    if cur:
        chunks.append("".join(cur))
    return chunks or [html]


# ── Core helpers ──────────────────────────────────────────────────────────────

def is_translation_field(name: str) -> bool:
    return bool(re.search(r"_(ar|fr|de|es|it|tr|ru)$", name))


def model():
    return apps.get_model("client", "ContentTranslation")


def text_format(text: str) -> str:
    return "html" if re.search(r"</?[a-zA-Z][^>]*>", text) else "text"


def fingerprint(text: str) -> str:
    return hashlib.sha256((text_format(text) + "\0" + text).encode()).hexdigest()


def queue_texts(texts, languages=LANGUAGES[1:]):
    values = {t for t in texts if isinstance(t, str) and t.strip()}
    if not values:
        return
    fps = {t: fingerprint(t) for t in values}
    M = model()
    existing = set(
        M.objects.filter(source_hash__in=fps.values())
        .values_list("source_hash", "target_language")
    )
    rows = [
        M(source_hash=fps[t], source_text=t, text_format=text_format(t), target_language=lang)
        for t in values
        for lang in languages
        if lang in LANGUAGES and lang != "en" and (fps[t], lang) not in existing
    ]
    M.objects.bulk_create(rows, ignore_conflicts=True)


def queue_instance(instance):
    texts = []
    for field in CONTENT_FIELDS.get(type(instance).__name__, ()):
        value = getattr(instance, field, None)
        texts.extend(value if isinstance(value, list) else [value])
    queue_texts(texts)


def locale_from_header(header: str) -> str:
    choices = []
    for position, token in enumerate((header or "en").split(",")):
        parts = token.strip().split(";")
        lang = parts[0].lower().split("-")[0]
        try:
            quality = next(
                (float(p.strip()[2:]) for p in parts[1:] if p.strip().startswith("q=")), 1.0
            )
        except ValueError:
            quality = 0
        if lang in LANGUAGES and quality > 0:
            choices.append((quality, -position, lang))
    return max(choices)[2] if choices else "en"


# ── Background drain ──────────────────────────────────────────────────────────

_translate_lock = threading.Lock()


def _drain_queue():
    if not _translate_lock.acquire(blocking=False):
        return
    try:
        translate_pending(limit=100)
    finally:
        _translate_lock.release()


# ── Translation worker ────────────────────────────────────────────────────────

def translate_pending(limit=50):
    from datetime import timedelta
    from django.db.models import Q

    retry_before = timezone.now() - timedelta(seconds=60)
    jobs = (
        model()
        .objects.filter(
            Q(status="pending") | Q(status="error", updated_at__lt=retry_before)
        )
        .order_by("id")[:limit]
    )
    successes = failures = 0

    for job in jobs:
        try:
            api_url = settings.CONTENT_TRANSLATION_URL.rstrip("/") + "/translate"
            api_key = getattr(settings, "CONTENT_TRANSLATION_API_KEY", "")
            base = {"source": "en", "target": job.target_language}
            if api_key:
                base["api_key"] = api_key

            protected, restore_map = _protect(job.source_text)
            chunk_fn = _chunk_html if job.text_format == "html" else _chunk_text
            chunks = chunk_fn(protected)

            translated_chunks = []
            for chunk in chunks:
                r = requests.post(
                    api_url,
                    json={**base, "q": chunk, "format": job.text_format},
                    timeout=(3, 60),
                )
                r.raise_for_status()
                t = r.json().get("translatedText")
                if not isinstance(t, str) or not t.strip():
                    raise ValueError("Empty translation from provider")
                translated_chunks.append(t)

            sep = "" if job.text_format == "html" else "\n\n"
            job.translated_text = _restore(sep.join(translated_chunks), restore_map)
            job.status = "ready"
            job.last_error = ""
            successes += 1

        except requests.RequestException as e:
            job.status = "error"
            job.last_error = type(e).__name__
            failures += 1
        except (ValueError, TypeError, AttributeError) as e:
            job.status = "error"
            job.last_error = type(e).__name__

        job.attempts += 1
        job.save(update_fields=["translated_text", "status", "last_error", "attempts", "updated_at"])
        if failures:
            break

    return successes, failures
