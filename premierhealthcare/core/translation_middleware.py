from django.utils.deprecation import MiddlewareMixin

from core.content_translation import (
    localize_payload,
)


class PublicContentTranslationMiddleware(MiddlewareMixin):

    def process_template_response(self, request, response):

        match = request.resolver_match

        if (
            request.method != "GET"
            or not match
            or match.url_name not in {
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
            or response.status_code != 200
            or not hasattr(response, "data")
        ):
            return response

        locale = getattr(request, "lang", "en")

        response.data, missing = localize_payload(
            response.data,
            locale,
        )

        response["Content-Language"] = locale
        response["X-Translation-Status"] = (
            "pending" if missing else "ready"
        )

        return response
