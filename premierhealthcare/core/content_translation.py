"""English CMS source, durable translation queue, cached public API localization."""
import hashlib
import re
from django.apps import apps
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import requests
# core/content_translation.py

import threading
_translate_lock = threading.Lock()

def _drain_queue():
    if not _translate_lock.acquire(blocking=False):
        return  # already running, skip
    try:
        translate_pending(limit=100)
    finally:
        _translate_lock.release()

def localize_payload(payload, locale):
    ...
    queue_texts(texts)
    cached = dict(model().objects.filter(..., status="ready").values_list(...))
    missing = 0
    ...
    result, missing = walk(payload), missing
    
    if missing:
        threading.Thread(target=_drain_queue, daemon=True).start()
    
    return result, missing
LANGUAGES = ("en", "ar", "fr", "de", "es", "it", "tr", "ru")
# Only public editorial models are eligible. Patient records/contact messages are excluded.
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
    "IVDripProduct": ("who_is_it_for", "how_it_helps", "key_ingredients", "perfect_pairings", "name", "tagline", "short_description", "full_description", "meta_title", "meta_description"),
    "IVDripFAQ": ("question", "answer"),
    "ArticlesPage": ("title", "short_description"),
    "ArticleCategory": ("name",),
    "Article": ("title", "excerpt", "content", "tags", "meta_title", "meta_description"),
}
# Public response keys only; IDs, slugs, URLs, prices, dates, codes stay unchanged.
PUBLIC_TEXT_KEYS = {
    "whoIsItFor", "howItHelps", "keyIngredients", "perfectPairings",
    "name", "title", "description", "shortDescription", "short_description",
    "fullDescription", "full_description", "tagline", "question", "answer",
    "excerpt", "content", "metaTitle", "meta_title", "metaDescription", "meta_description",
    "bio", "specialization", "specialty", "position", "languages", "address", "city",
    "department_name", "branch_name", "service_name", "role", "text", "tags", "service_names",
}
PUBLIC_ROUTES = {
    "iv-drip-therapy-page", "iv-drip-therapy-detail", "articles-list", "article-detail",
    "article-categories", "wizard-departments", "wizard-services", "wizard-branches",
    "wizard-doctors", "branches", "doctors", "departments", "doctor-detail-direct",
    "doctor-details", "services", "service-detail", "service-detail-legacy",
    "gallery-list", "branch-gallery-public-list", "testimonial-public-list",
}


def is_translation_field(name):
    return bool(re.search(r"_(ar|fr|de|es|it|tr|ru)$", name))


def model():
    return apps.get_model("client", "ContentTranslation")


def text_format(text):
    return "html" if re.search(r"</?[a-zA-Z][^>]*>", text) else "text"


def fingerprint(text):
    return hashlib.sha256((text_format(text) + "\0" + text).encode()).hexdigest()


def queue_texts(texts, languages=LANGUAGES[1:]):
    values = {text for text in texts if isinstance(text, str) and text.strip()}
    existing = set(model().objects.filter(source_hash__in=[fingerprint(t) for t in values]).values_list("source_hash", "target_language"))
    rows = [model()(source_hash=fingerprint(text), source_text=text, text_format=text_format(text), target_language=lang)
            for text in values for lang in languages if lang in LANGUAGES and lang != "en" and (fingerprint(text), lang) not in existing]
    model().objects.bulk_create(rows, ignore_conflicts=True)


def queue_instance(instance):
    texts = []
    for field in CONTENT_FIELDS.get(type(instance).__name__, ()):
        value = getattr(instance, field, None)
        texts.extend(value if isinstance(value, list) else [value])
    queue_texts(texts)


def locale_from_header(header):
    choices = []
    for position, token in enumerate((header or "en").split(",")):
        parts = token.strip().split(";")
        lang = parts[0].lower().split("-")[0]
        try:
            quality = next((float(p.strip()[2:]) for p in parts[1:] if p.strip().startswith("q=")), 1.0)
        except ValueError:
            quality = 0
        if lang in LANGUAGES and quality > 0:
            choices.append((quality, -position, lang))
    return max(choices)[2] if choices else "en"


def localize_payload(payload, locale):
    """One cache query per response. No network translation during page requests."""
    texts = set()
    def collect(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key in PUBLIC_TEXT_KEYS and isinstance(item, str) and item.strip(): texts.add(item)
                elif key in PUBLIC_TEXT_KEYS and isinstance(item, list):
                    texts.update(x for x in item if isinstance(x, str) and x.strip())
                if isinstance(item, (dict, list)): collect(item)
        elif isinstance(value, list):
            for item in value: collect(item)
    collect(payload)
    if locale == "en" or not texts:
        return payload, 0
    queue_texts(texts)  # Includes computed public labels missed by model signals.
    cached = dict(model().objects.filter(source_hash__in=[fingerprint(t) for t in texts],
                  target_language=locale, status="ready").values_list("source_hash", "translated_text"))
    missing = 0
    def translated(text):
        nonlocal missing
        if not text.strip(): return text
        result = cached.get(fingerprint(text))
        if result: return result
        missing += 1
        return text
    def walk(value):
        if isinstance(value, list): return [walk(x) for x in value]
        if not isinstance(value, dict): return value
        result = {key: walk(item) for key, item in value.items()}
        for key, item in value.items():
            if key in PUBLIC_TEXT_KEYS and isinstance(item, str):
                result[key] = translated(item)
                if locale == "ar": result[key + "_ar"] = result[key]
            elif key in PUBLIC_TEXT_KEYS and isinstance(item, list):
                result[key] = [translated(x) if isinstance(x, str) else walk(x) for x in item]
        return result
    return walk(payload), missing


def translate_pending(limit=50):
    """Run from one worker process; errors stay retryable and never break a save."""
    from datetime import timedelta
    from django.db.models import Q
    retry_before = timezone.now() - timedelta(seconds=60)
    jobs = model().objects.filter(Q(status="pending") | Q(status="error", updated_at__lt=retry_before)).order_by("id")[:limit]
    successes = failures = 0
    for job in jobs:
        try:
            url = settings.CONTENT_TRANSLATION_URL.rstrip("/") + "/translate"
            body = {"q": job.source_text, "source": "en", "target": job.target_language, "format": job.text_format}
            key = getattr(settings, "CONTENT_TRANSLATION_API_KEY", "")
            if key: body["api_key"] = key
            response = requests.post(url, json=body, timeout=(3, 60))
            response.raise_for_status()
            translated = response.json().get("translatedText")
            if not isinstance(translated, str) or not translated.strip():
                raise ValueError("Provider returned an empty or invalid translation")
            # Only the English source's HTML structure may be rendered. Translate text
            # nodes individually for HTML below rather than trusting generated markup.
            if job.text_format == "html":
                from bs4 import BeautifulSoup, Comment
                source = BeautifulSoup(job.source_text, "html.parser")
                target = BeautifulSoup(translated, "html.parser")
                src_nodes = [n for n in source.find_all(string=True) if not isinstance(n, Comment) and n.parent.name not in ("script", "style") and n.strip()]
                dst_nodes = [n for n in target.find_all(string=True) if not isinstance(n, Comment) and n.parent.name not in ("script", "style") and n.strip()]
                if len(src_nodes) != len(dst_nodes): raise ValueError("Translated HTML structure differs; translation retained for retry")
                for src_node, dst_node in zip(src_nodes, dst_nodes): src_node.replace_with(str(dst_node))
                translated = str(source)
            job.translated_text = translated
            job.status = "ready"
            job.last_error = ""
            successes += 1
        except (requests.RequestException, ValueError, TypeError, AttributeError) as error:
            job.status = "error"
            # Never retain provider URLs/keys or content in error messages.
            job.last_error = type(error).__name__
            failures += 1
        job.attempts += 1
        job.save(update_fields=["translated_text", "status", "last_error", "attempts", "updated_at"])
        if failures: break  # Avoid waiting once per language when the service is offline.
    return successes, failures
