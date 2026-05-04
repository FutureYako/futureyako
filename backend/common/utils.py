import random
import secrets
import string
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from django.utils import timezone


# ── Reference number generators ───────────────────────────────────────────────

def generate_wallet_number() -> str:
    first_digit = random.choice("123456789")
    remaining_digits = "".join(random.choices(string.digits, k=11))
    digits = first_digit + remaining_digits
    return f"SV {digits[:4]} {digits[4:8]} {digits[8:12]}"


def generate_invitation_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_investment_ref() -> str:
    suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"INV-{suffix}"


def generate_transaction_ref() -> str:
    suffix = "".join(secrets.choice(string.digits) for _ in range(10))
    return f"TXN-{suffix}"


# ── Financial calculations ─────────────────────────────────────────────────────

def apply_platform_fee(amount: Decimal, fee_pct: Decimal) -> tuple[Decimal, Decimal]:
    """Returns (fee_amount, net_amount)."""
    fee = (amount * fee_pct / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return fee, amount - fee


def compute_projected_return(amount: Decimal, annual_roi: Decimal) -> Decimal:
    return (amount * annual_roi / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ── Autosave scheduling ────────────────────────────────────────────────────────

FREQUENCY_DELTAS = {
    "Daily":          timedelta(days=1),
    "Weekly":         timedelta(weeks=1),
    "Monthly":        timedelta(days=30),
    "Every 2 Months": timedelta(days=60),
}

RETRY_DELAYS_SECONDS = {1: 3600, 2: 10800, 3: 86400}  # 1h, 3h, 24h


def compute_next_deduction(frequency: str, from_dt=None):
    base = from_dt or timezone.now()
    delta = FREQUENCY_DELTAS.get(frequency, timedelta(days=30))
    return base + delta


def compute_retry_time(retry_count: int):
    delay = RETRY_DELAYS_SECONDS.get(retry_count, 86400)
    return timezone.now() + timedelta(seconds=delay)


# ── Password validation ────────────────────────────────────────────────────────

def validate_password_strength(password: str) -> list[str]:
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters.")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter.")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number.")
    if not any(c in string.punctuation for c in password):
        errors.append("Password must contain at least one special character.")
    return errors
