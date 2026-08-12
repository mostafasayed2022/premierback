from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class SafeJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that returns None (AnonymousUser) instead of raising
    InvalidToken when an invalid or expired token is passed in the Authorization header.
    
    This ensures that endpoints marked with `AllowAny` permission (e.g., booking wizard,
    public testimonials, service catalog) do not return 401 Unauthorized for guest users
    or users with expired tokens stored in their local storage.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            return None

        return self.get_user(validated_token), validated_token
