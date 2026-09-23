from django.utils.cache import patch_vary_headers
from django.utils.deprecation import MiddlewareMixin
from core.content_translation import PUBLIC_ROUTES, locale_from_header, localize_payload

class PublicContentTranslationMiddleware(MiddlewareMixin):
    def process_template_response(self, request, response):
        match = request.resolver_match
        if (request.method != "GET" or not match or match.url_name not in PUBLIC_ROUTES
                or response.status_code != 200 or not hasattr(response, "data")):
            return response
        locale = locale_from_header(request.headers.get("Accept-Language"))
        response.data, missing = localize_payload(response.data, locale)
        response["Content-Language"] = locale
        response["X-Translation-Status"] = "pending" if missing else "ready"
        patch_vary_headers(response, ["Accept-Language"])
        return response
