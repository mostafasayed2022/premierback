from django.utils.cache import patch_vary_headers
from django.utils.deprecation import MiddlewareMixin
from core.content_translation import PUBLIC_ROUTES, locale_from_header, localize_payload
from django.utils.deprecation import MiddlewareMixin


class PublicContentTranslationMiddleware(MiddlewareMixin):
    pass

