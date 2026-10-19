import base64
import hashlib
import hmac
import json
import os
from unittest.mock import Mock, patch

import requests
from django.test import SimpleTestCase

from client.cybersource_service import CyberSourceError, CyberSourceService


TEST_SECRET = base64.b64encode(b"cybersource-unit-test-secret").decode("ascii")
TEST_ENV = {
    "CYBERSOURCE_MERCHANT_ID": "test-merchant",
    "CYBERSOURCE_KEY_ID": "unit-test-key",
    "CYBERSOURCE_SECRET_KEY": TEST_SECRET,
    "CYBERSOURCE_ENV": "test",
    "CYBERSOURCE_TARGET_ORIGINS": "https://example.com/,https://www.example.com",
}


class CyberSourceServiceTests(SimpleTestCase):
    @patch.dict(os.environ, TEST_ENV, clear=False)
    def test_uses_test_host_and_decodes_shared_secret(self):
        service = CyberSourceService()

        self.assertEqual(service.host, "apitest.cybersource.com")
        self.assertEqual(service.base_url, "https://apitest.cybersource.com")
        self.assertEqual(service.secret, b"cybersource-unit-test-secret")

    @patch.dict(os.environ, TEST_ENV, clear=False)
    def test_authorization_jwt_has_hmac_signature_and_required_request_claims(self):
        service = CyberSourceService()
        body = '{"test":true}'

        token = service._authorization("POST", "/uc/v1/sessions", body)
        encoded_header, encoded_claims, encoded_signature = token.split(".")

        def decode(part):
            part += "=" * (-len(part) % 4)
            return json.loads(base64.urlsafe_b64decode(part.encode("ascii")))

        header = decode(encoded_header)
        claims = decode(encoded_claims)
        expected = hmac.new(
            service.secret,
            f"{encoded_header}.{encoded_claims}".encode("ascii"),
            hashlib.sha256,
        ).digest()
        expected_signature = base64.urlsafe_b64encode(expected).rstrip(b"=").decode("ascii")

        self.assertEqual(header["alg"], "HS256")
        self.assertEqual(header["kid"], "unit-test-key")
        self.assertEqual(encoded_signature, expected_signature)
        self.assertEqual(claims["iss"], "test-merchant")
        self.assertEqual(claims["v-c-merchant-id"], "test-merchant")
        self.assertEqual(claims["request-method"], "post")
        self.assertEqual(claims["request-resource-path"], "/uc/v1/sessions")
        self.assertEqual(claims["request-host"], "apitest.cybersource.com")
        self.assertEqual(claims["digest"], base64.b64encode(hashlib.sha256(body.encode()).digest()).decode())
        self.assertEqual(claims["digestAlgorithm"], "SHA-256")
        self.assertEqual(claims["v-c-jwt-version"], 2)

    @patch.dict(os.environ, TEST_ENV, clear=False)
    @patch("client.cybersource_service.requests.request", side_effect=requests.ConnectionError("test"))
    def test_transport_failure_preserves_gateway_status_code(self, mocked_request):
        service = CyberSourceService()

        with self.assertRaises(CyberSourceError) as caught:
            service.request("POST", "/uc/v1/sessions", {})

        self.assertEqual(caught.exception.status_code, 502)

    @patch.dict(os.environ, TEST_ENV, clear=False)
    @patch("client.cybersource_service.requests.request")
    def test_http_failure_preserves_upstream_status_code(self, mocked_request):
        mocked_response = Mock()
        mocked_response.ok = False
        mocked_response.status_code = 401
        mocked_request.return_value = mocked_response

        service = CyberSourceService()
        with self.assertRaises(CyberSourceError) as caught:
            service.request("POST", "/uc/v1/sessions", {})

        self.assertEqual(caught.exception.status_code, 401)

    @patch.dict(os.environ, {**TEST_ENV, "CYBERSOURCE_TARGET_ORIGINS": "http://example.com"}, clear=False)
    def test_rejects_non_https_target_origin(self):
        service = CyberSourceService()

        with self.assertRaises(CyberSourceError):
            service._target_origins()

    @patch.dict(os.environ, TEST_ENV, clear=False)
    @patch("client.cybersource_service.CyberSourceService.request")
    def test_capture_context_extracts_server_provided_sdk_url_and_integrity(self, mocked_request):
        context_payload = {
            "data": {
                "clientLibrary": "https://example.com/unified-checkout.js",
                "clientLibraryIntegrity": "sha384-test-integrity",
            }
        }
        encoded_payload = base64.urlsafe_b64encode(
            json.dumps(context_payload).encode("utf-8")
        ).rstrip(b"=").decode("ascii")
        fake_capture_context = f"header.{encoded_payload}.signature"
        mocked_response = Mock()
        mocked_response.json.return_value = {"captureContext": fake_capture_context}
        mocked_request.return_value = mocked_response

        booking = Mock()
        booking.pk = "booking-test-id"
        booking.fee = "125.00"

        result = CyberSourceService().create_capture_context(booking)

        self.assertEqual(result["capture_context"], fake_capture_context)
        self.assertEqual(result["client_library"], "https://example.com/unified-checkout.js")
        self.assertEqual(result["client_library_integrity"], "sha384-test-integrity")
        mocked_request.assert_called_once()
        payload = mocked_request.call_args.args[2]
        self.assertEqual(
            payload["data"]["orderInformation"]["amountDetails"]["totalAmount"],
            "125.00",
        )
        self.assertEqual(
            payload["data"]["orderInformation"]["amountDetails"]["currency"],
            "EGP",
        )
