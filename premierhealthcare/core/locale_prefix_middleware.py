from django.utils.deprecation import MiddlewareMixin


SUPPORTED_LOCALES = {
    "ar",
    "fr",
    "de",
    "es",
    "it",
    "tr",
    "ru",
}


class APILocalePrefixMiddleware(MiddlewareMixin):
    """
    Resolve locale from /api/<locale>/... while preserving existing routes.

    /api/ar/wizard/doctors/ -> request.lang = "ar"
                              Django resolves /api/wizard/doctors/

    /api/fr/articles/       -> request.lang = "fr"
                              Django resolves /api/articles/

    /api/wizard/doctors/    -> request.lang = "en"
                              unchanged
    """

    def process_request(self, request):
        path = request.path_info or request.path
        api_prefix = "/api/"

        if not path.startswith(api_prefix):
            request.lang = "en"
            return None

        remainder = path[len(api_prefix):]
        locale, separator, rest = remainder.partition("/")

        locale = locale.lower().strip()

        if locale not in SUPPORTED_LOCALES:
            request.lang = "en"
            return None

        request.lang = locale
        request.path_info = api_prefix + rest if separator else api_prefix

        return None
