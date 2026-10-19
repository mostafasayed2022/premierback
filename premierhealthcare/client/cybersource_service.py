"""CyberSource Unified Checkout helpers for Premier Healthcare."""
import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from decimal import Decimal
from urllib.parse import quote

import jwt
import requests


class CyberSourceError(Exception):
    """Safe integration error for CyberSource payment operations."""


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _decode_payload_unverified(token: str) -> dict:
    try:
        part = token.split(".")[1]
        part += "=" * (-len(part) % 4)
        return json.loads(base64.urlsafe_b64decode(part.encode("ascii")))
    except (IndexError, ValueError, TypeError, json.JSONDecodeError) as exc:
        raise CyberSourceError("CyberSource returned an invalid JWT.") from exc


def _first_dict(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        for item in value:
            found = _first_dict(item)
            if found is not None:
                return found
    return None


class CyberSourceService:
    """REST client using CyberSource shared-secret JWT authentication."""

    def __init__(self):
        self.merchant_id = os.getenv("CYBERSOURCE_MERCHANT_ID", "").strip()
        self.key_id = os.getenv("CYBERSOURCE_KEY_ID", "").strip()
        secret = os.getenv("CYBERSOURCE_SECRET_KEY", "").strip()
        environment = os.getenv("CYBERSOURCE_ENV", "test").strip().lower()

        if environment not in {"test", "production"}:
            raise CyberSourceError("CYBERSOURCE_ENV must be test or production.")
        self.host = (
            "apitest.cybersource.com" if environment == "test"
            else "api.cybersource.com"
        )
        self.base_url = f"https://{self.host}"

        if not self.merchant_id or not self.key_id or not secret:
            raise CyberSourceError("CyberSource credentials are not configured.")
        try:
            self.secret = base64.b64decode(secret, validate=True)
        except (ValueError, TypeError) as exc:
            raise CyberSourceError(
                "CYBERSOURCE_SECRET_KEY must be the base64 shared-secret key."
            ) from exc
        if not self.secret:
            raise CyberSourceError("CyberSource shared-secret key is empty.")

    def _authorization(self, method, path, body=""):
        now = int(time.time())
        header = {"alg": "HS256", "typ": "JWT", "kid": self.key_id}
        claims = {
            "iat": now,
            "exp": now + 300,
            "jti": str(uuid.uuid4()),
            "iss": self.merchant_id,
            "request-method": method.lower(),
            "request-resource-path": path,
            "request-host": self.host,
            "v-c-jwt-version": "2",
            "v-c-merchant-id": self.merchant_id,
        }
        if body:
            digest = hashlib.sha256(body.encode("utf-8")).digest()
            claims["digest"] = base64.b64encode(digest).decode("ascii")
            claims["digestAlgorithm"] = "SHA-256"

        unsigned = (
            _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
            + "."
            + _b64url(json.dumps(claims, separators=(",", ":")).encode("utf-8"))
        )
        signature = hmac.new(
            self.secret, unsigned.encode("ascii"), hashlib.sha256
        ).digest()
        return unsigned + "." + _b64url(signature)

    def request(self, method, path, payload=None):
        body = (
            json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
            if payload is not None else ""
        )
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "v-c-merchant-id": self.merchant_id,
            "Authorization": "Bearer " + self._authorization(method, path, body),
        }
        try:
            response = requests.request(
                method.upper(),
                self.base_url + path,
                headers=headers,
                data=body if body else None,
                timeout=(5, 25),
            )
        except requests.RequestException as exc:
            raise CyberSourceError("Could not connect to CyberSource.") from exc

        if not response.ok:
            # Do not expose gateway response bodies or signed headers.
            raise CyberSourceError(
                f"CyberSource request failed (HTTP {response.status_code}).",
                status_code=response.status_code,
            )
        return response

    def _target_origins(self):
        configured = os.getenv("CYBERSOURCE_TARGET_ORIGINS", "")
        values = [x.strip().rstrip("/") for x in configured.split(",") if x.strip()]
        if not values:
            raise CyberSourceError(
                "Set CYBERSOURCE_TARGET_ORIGINS to the frontend HTTPS origin(s)."
            )
        for origin in values:
            if not origin.startswith("https://") and not origin.startswith("http://localhost"):
                raise CyberSourceError(
                    "CyberSource target origins must use HTTPS, except localhost."
                )
        return values

    def create_capture_context(self, booking):
        payload = {
            "targetOrigins": self._target_origins(),
            "country": "EG",
            "locale": "en_US",
            "allowedPaymentTypes": ["PANENTRY"],
            "completeMandate": {
                "type": "CAPTURE",
                "consumerAuthentication": "3DS",
            },
            "captureMandate": {
                "showConfirmationStep": True,
                "requestEmail": True,
                "requestPhone": True,
                "requestShipping": False,
            },
            "data": {
                "clientReferenceInformation": {"code": str(booking.pk)},
                "orderInformation": {
                    "amountDetails": {
                        "totalAmount": format(Decimal(booking.fee), ".2f"),
                        "currency": "EGP",
                    }
                },
            },
        }
        response = self.request("POST", "/uc/v1/sessions", payload)
        try:
            parsed = response.json()
        except ValueError:
            parsed = response.text.strip()

        if isinstance(parsed, dict):
            context = parsed.get("captureContext") or parsed.get("capture_context")
        elif isinstance(parsed, str):
            context = parsed.strip().strip('"')
        else:
            context = None

        if not isinstance(context, str) or len(context.split(".")) != 3:
            raise CyberSourceError("CyberSource did not return a valid capture context.")

        claims = _decode_payload_unverified(context)
        data = claims.get("data") or {}
        client_library = data.get("clientLibrary")
        integrity = data.get("clientLibraryIntegrity")
        if (
            not isinstance(client_library, str)
            or not client_library.startswith("https://")
            or not isinstance(integrity, str)
            or not integrity.strip()
        ):
            raise CyberSourceError(
                "CyberSource did not provide a valid client library and integrity hash."
            )

        return {
            "capture_context": context,
            "client_library": client_library,
            "client_library_integrity": integrity,
        }

    def _get_result_public_key(self, kid):
        response = self.request("GET", "/flex/v2/public-keys/" + quote(kid, safe=""))
        try:
            jwk = response.json()
        except ValueError as exc:
            raise CyberSourceError("CyberSource returned an invalid public key.") from exc

        # Depending on the key endpoint response, the JWK may be direct or nested.
        if isinstance(jwk, dict) and isinstance(jwk.get("key"), dict):
            jwk = jwk["key"]
        if isinstance(jwk, dict) and isinstance(jwk.get("keys"), list):
            jwk = next(
                (key for key in jwk["keys"] if key.get("kid") == kid),
                None,
            )
        if not isinstance(jwk, dict) or jwk.get("kty") != "RSA":
            raise CyberSourceError("CyberSource public key was not a valid RSA JWK.")
        try:
            return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
        except Exception as exc:
            raise CyberSourceError("Unable to load the CyberSource public key.") from exc

    def verify_completed_result(self, result_jwt, booking, payment):
        """Cryptographically verify the CyberSource completion JWT and validate order details."""
        if not isinstance(result_jwt, str) or len(result_jwt) > 50000:
            raise CyberSourceError("Invalid CyberSource payment result.")
        try:
            header = jwt.get_unverified_header(result_jwt)
        except jwt.PyJWTError as exc:
            raise CyberSourceError("Invalid CyberSource payment result JWT.") from exc

        if header.get("alg") != "RS256" or not header.get("kid"):
            raise CyberSourceError("Unexpected CyberSource result signing algorithm.")

        public_key = self._get_result_public_key(str(header["kid"]))
        try:
            claims = jwt.decode(
                result_jwt,
                key=public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
                leeway=30,
            )
        except jwt.PyJWTError as exc:
            raise CyberSourceError("CyberSource payment result signature is invalid.") from exc

        result = claims.get("completeResponse")
        if not isinstance(result, dict):
            result = claims.get("data") if isinstance(claims.get("data"), dict) else claims
        if isinstance(result.get("completeResponse"), dict):
            result = result["completeResponse"]
        details = result.get("details") if isinstance(result.get("details"), dict) else {}
        reference_info = details.get("clientReferenceInformation") or result.get(
            "clientReferenceInformation"
        ) or {}
        order_info = details.get("orderInformation") or result.get("orderInformation") or {}
        amount_info = order_info.get("amountDetails") or {}
        reference = reference_info.get("code")

        if str(reference or "") != str(booking.pk):
            raise CyberSourceError("Payment result does not match this booking.")

        try:
            amount = Decimal(str(amount_info.get("totalAmount")))
        except Exception as exc:
            raise CyberSourceError("Payment amount could not be verified.") from exc
        if amount != Decimal(str(payment.amount)):
            raise CyberSourceError("CyberSource payment amount does not match the booking.")
        currency = str(amount_info.get("currency") or "").upper()
        if currency != str(payment.currency or "EGP").upper():
            raise CyberSourceError("CyberSource currency does not match the booking.")

        outcome = str(result.get("outcome") or "").upper()
        state = str(result.get("status") or "").upper()
        response_code = str(
            (details.get("processorInformation") or {}).get("responseCode") or ""
        )
        transaction_id = str(
            result.get("id")
            or (details.get("processorInformation") or {}).get("transactionId")
            or ""
        )
        if not transaction_id:
            raise CyberSourceError("CyberSource result did not include a transaction ID.")

        if outcome in {"COMPLETED", "AUTHORIZED", "SETTLED", "CAPTURED", "SUCCESS", "SUCCEEDED"}:
            payment_state = "paid"
        elif outcome in {"DECLINED", "FAILED", "REJECTED", "CANCELED", "CANCELLED"} or state in {
            "DECLINED", "FAILED", "REJECTED", "CANCELED", "CANCELLED"
        }:
            payment_state = "failed"
        else:
            payment_state = "pending"

        return {
            "state": payment_state,
            "transaction_id": transaction_id,
            "status": state or outcome or "PENDING",
            "response_code": response_code,
        }
