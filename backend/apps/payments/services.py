import requests
from django.conf import settings

ULTRANER_BASE = "https://api.ultraner.com"

# When Django is hosted on a platform that restricts outbound connections (e.g. PythonAnywhere),
# set ULTRANER_VIA_URL to the Next.js forwarder URL so calls route through Vercel instead.
_ULTRANER_VIA_URL = getattr(settings, "ULTRANER_VIA_URL", "").rstrip("/")
_FORWARDER_SECRET = getattr(settings, "ULTRANER_FORWARDER_SECRET", "")

# Canonical provider names as Ultraner expects them
_PROVIDER_CANONICAL = {
    "airtel": "Airtel",
    "tigo": "Tigo",
    "halopesa": "Halopesa",
    "halotel": "Halopesa",   # Halotel's mobile money brand is Halopesa on AzamPay
    "azampesa": "Azampesa",
    "mpesa": "Mpesa",
    "m-pesa": "Mpesa",
    "vodacom": "Vodacom",
    "mtn": "MTN",
    "ttcl": "TTCL",
}


def normalize_provider(name: str) -> str:
    """Return the Ultraner-canonical provider name, or the original if unknown."""
    return _PROVIDER_CANONICAL.get(name.strip().lower(), name.strip())


def normalize_phone(number: str, default_country_code: str = "255") -> str:
    """
    Ensure the phone number includes the country dialling code.
    Strips spaces, dashes, parentheses, and leading '+'.
    Converts a leading '0' to the country code (Tanzania 255 by default).
    """
    cleaned = number.strip().lstrip("+").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if cleaned.startswith("0"):
        cleaned = default_country_code + cleaned[1:]
    return cleaned


class UltranerError(Exception):
    def __init__(self, message, code=None):
        self.message = message
        self.code = code
        super().__init__(message)


class UltranerClient:
    """Thin wrapper around the Ultraner v1 AzamPay API."""

    def __init__(self):
        self.api_key = getattr(settings, "ULTRANER_API_KEY", "")
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
        }

    def _post(self, path: str, payload: dict) -> dict:
        if _ULTRANER_VIA_URL:
            # Route through Next.js/Vercel forwarder to bypass outbound proxy restrictions
            url = f"{_ULTRANER_VIA_URL}{path}"
            req_headers = {"Content-Type": "application/json"}
            if _FORWARDER_SECRET:
                req_headers["X-Forwarder-Secret"] = _FORWARDER_SECRET
        else:
            url = f"{ULTRANER_BASE}{path}"
            req_headers = self.headers

        try:
            resp = requests.post(url, json=payload, headers=req_headers, timeout=30)
        except requests.RequestException as exc:
            raise UltranerError(f"Network error contacting payment gateway: {exc}")

        try:
            data = resp.json()
        except ValueError:
            raise UltranerError(f"Invalid response from gateway (HTTP {resp.status_code})")

        if not resp.ok or not data.get("success", True):
            import logging
            logging.getLogger("payments").warning(
                "Ultraner rejected request — payload: %s | response: %s", payload, data
            )
            raise UltranerError(
                data.get("message") or data.get("error") or f"Gateway error HTTP {resp.status_code}",
                code=resp.status_code,
            )
        # Normalise: always return the nested `data` dict if present
        return data.get("data") or data

    def mno_checkout(
        self,
        account_number: str,
        provider: str,
        amount: int,
        reference: str,
        currency: str = "TZS",
        description: str = "",
    ) -> dict:
        """
        Initiate an MNO (mobile money) STK push.
        account_number must include the country prefix (e.g. 255712345678 for Tanzania).
        provider: Airtel | M-Pesa | Tigo | Halotel | TTCL (TZ) or MTN | Airtel (RW).
        Ultraner auto-routes to AzamPay TZ or RW based on the phone prefix.
        """
        return self._post("/v1/payments/express/mno", {
            "account_number": account_number,
            "provider": provider,
            "amount": amount,
            "currency": currency,
            "reference": reference,
            "description": description,
        })

    def bank_checkout(
        self,
        account_number: str,
        bank_code: str,
        account_name: str,
        amount: int,
        reference: str,
        currency: str = "TZS",
        description: str = "",
    ) -> dict:
        """
        Initiate a bank checkout via AzamPay v1.
        bank_code: short bank identifier (e.g. CRDB, NMB, EQUITY).
        """
        return self._post("/v1/payments/express/bank", {
            "account_number": account_number,
            "bank_code": bank_code,
            "account_name": account_name,
            "amount": amount,
            "currency": currency,
            "reference": reference,
            "description": description,
        })
