import hashlib
import hmac
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction as db_transaction
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.transactions.models import Transaction
from apps.wallets.models import FundingSource
from .services import UltranerClient, UltranerError, normalize_provider, normalize_phone


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _parse_amount(raw) -> Decimal:
    try:
        val = Decimal(str(raw))
        if val <= 0:
            raise ValueError
        return val
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Amount must be a positive number.")


def _get_mobile_funding_source(user, funding_source_id):
    if not funding_source_id:
        return None
    try:
        return FundingSource.objects.get(
            id=funding_source_id,
            wallet__user=user,
            source_type="mobile",
            status__in=["active", "verification_pending"],
        )
    except FundingSource.DoesNotExist:
        return None


def _get_bank_funding_source(user, funding_source_id):
    if not funding_source_id:
        return None
    try:
        return FundingSource.objects.get(
            id=funding_source_id,
            wallet__user=user,
            source_type="bank",
            status__in=["active", "verification_pending"],
        )
    except FundingSource.DoesNotExist:
        return None


def _broadcast_deposit_updates(txn: Transaction):
    """Fire WebSocket + outbound webhook events after a confirmed deposit."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from apps.wallets.models import Wallet
        from apps.webhooks.tasks import broadcast_webhook_event

        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f"user_{txn.user_id}_transactions",
            {
                "type": "transaction_created",
                "data": {
                    "id": txn.id,
                    "transaction_type": txn.transaction_type,
                    "amount": str(txn.amount),
                    "net_amount": str(txn.net_amount),
                    "status": txn.status,
                    "description": txn.description,
                    "created_at": txn.created_at.isoformat(),
                },
            },
        )

        try:
            wallet = Wallet.objects.get(user=txn.user)
            async_to_sync(channel_layer.group_send)(
                f"user_{txn.user_id}_wallet",
                {
                    "type": "wallet_update",
                    "data": {
                        "total_balance": str(wallet.total_balance),
                        "available_balance": str(wallet.available_balance),
                    },
                },
            )
        except Wallet.DoesNotExist:
            pass

        broadcast_webhook_event.delay(
            "transaction.created",
            {
                "transaction_id": str(txn.id),
                "type": txn.transaction_type,
                "amount": str(txn.amount),
                "user_id": txn.user_id,
            },
            user_id=txn.user_id,
        )
        broadcast_webhook_event.delay(
            "wallet.deposit",
            {"amount": str(txn.amount), "user_id": txn.user_id},
            user_id=txn.user_id,
        )
    except Exception:
        pass


# ─── Deposit Endpoints ────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def initiate_mno_deposit(request):
    """
    Initiate a mobile money (MNO) deposit via Ultraner AzamPay v1.

    Body:
      amount          (required) — amount in TZS
      phone_number    (required) — full number with country prefix e.g. 255712345678
      provider        (required) — Airtel | M-Pesa | Tigo | Halotel | TTCL | MTN
      funding_source_id (optional) — UUID of an existing mobile FundingSource
    """
    raw_amount = request.data.get("amount")
    phone_number = str(request.data.get("phone_number", "")).strip()
    provider = str(request.data.get("provider", "")).strip()
    funding_source_id = request.data.get("funding_source_id")

    if not raw_amount:
        return Response({"error": "amount is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        amount = _parse_amount(raw_amount)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    funding_source = _get_mobile_funding_source(request.user, funding_source_id)

    # Auto-fill phone/provider from saved FundingSource when not supplied directly
    if funding_source:
        if not phone_number:
            phone_number = funding_source.account_identifier
        if not provider:
            provider = funding_source.name

    if not phone_number or not provider:
        return Response(
            {"error": "phone_number and provider are required (or provide a valid funding_source_id)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with db_transaction.atomic():
        txn = Transaction.objects.create(
            user=request.user,
            transaction_type="Deposit",
            category="Savings",
            amount=amount,
            description=f"Mobile money deposit via {provider} ({phone_number})",
            funding_source=funding_source,
            status="pending",
        )

    client = UltranerClient()
    try:
        result = client.mno_checkout(
            account_number=normalize_phone(phone_number),
            provider=normalize_provider(provider),
            amount=int(amount),
            reference=txn.reference_number,
            description="Future Yako savings deposit",
        )
    except UltranerError as exc:
        txn.mark_failed(exc.message[:200])
        return Response({"error": exc.message}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(
        {
            "transaction_id": str(txn.id),
            "reference_number": txn.reference_number,
            "ultraner_reference": result.get("transaction_id", ""),
            "status": "pending",
            "message": result.get(
                "message",
                f"A payment prompt has been sent to {phone_number}. "
                "Complete it on your phone to confirm the deposit.",
            ),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def initiate_bank_deposit(request):
    """
    Initiate a bank checkout deposit via Ultraner AzamPay v1.

    Body:
      amount            (required) — amount in TZS
      account_number    (required) — bank account number
      bank_code         (required) — short bank code e.g. CRDB | NMB | EQUITY | ABSA
      account_name      (required) — account holder name
      funding_source_id (optional) — UUID of an existing bank FundingSource
    """
    raw_amount = request.data.get("amount")
    account_number = str(request.data.get("account_number", "")).strip()
    bank_code = str(request.data.get("bank_code", "")).strip().upper()
    account_name = str(request.data.get("account_name", "")).strip()
    funding_source_id = request.data.get("funding_source_id")

    if not raw_amount:
        return Response({"error": "amount is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        amount = _parse_amount(raw_amount)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    funding_source = _get_bank_funding_source(request.user, funding_source_id)

    # Auto-fill account details from saved FundingSource when not supplied directly
    if funding_source:
        if not account_number:
            account_number = funding_source.account_identifier
        if not bank_code:
            bank_code = funding_source.name.upper()
        if not account_name:
            account_name = funding_source.account_holder_name

    if not all([account_number, bank_code, account_name]):
        return Response(
            {"error": "account_number, bank_code, and account_name are required (or provide a valid funding_source_id)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with db_transaction.atomic():
        txn = Transaction.objects.create(
            user=request.user,
            transaction_type="Deposit",
            category="Savings",
            amount=amount,
            description=f"Bank deposit via {bank_code} — {account_number}",
            funding_source=funding_source,
            status="pending",
        )

    client = UltranerClient()
    try:
        result = client.bank_checkout(
            account_number=account_number,
            bank_code=bank_code,
            account_name=account_name,
            amount=int(amount),
            reference=txn.reference_number,
            description="Future Yako savings deposit",
        )
    except UltranerError as exc:
        txn.mark_failed(exc.message[:200])
        return Response({"error": exc.message}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(
        {
            "transaction_id": str(txn.id),
            "reference_number": txn.reference_number,
            "ultraner_reference": result.get("transaction_id", ""),
            "status": "pending",
            "message": result.get(
                "message",
                "Bank deposit initiated. Funds will reflect in your wallet once confirmed.",
            ),
        },
        status=status.HTTP_201_CREATED,
    )


# ─── Webhook ──────────────────────────────────────────────────────────────────

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def ultraner_webhook(request):
    """
    Receive payment status callbacks from Ultraner.

    Ultraner payload shape:
      {
        "event": "payment.success" | "payment.failed",
        "created_at": "...",
        "data": {
          "transaction_id": "<ultraner-internal-id>",
          "merchant_reference": "<our TXN-XXXXXXXXXX>",
          "type": "express",
          "amount": 1000,
          "currency": "TZS",
          "provider_channel": "mno",
          "wallet_id": "..."
        }
      }

    HMAC signing: Ultraner signs with HMAC-SHA256 using SHA-256(rawSecret) as key.
    Header: X-Ultraner-Signature: sha256=<hex>
    """
    # Verify HMAC — Ultraner signs with SHA-256(rawSecret) as the HMAC key,
    # not the raw secret itself. We must hash our stored secret first.
    webhook_secret = getattr(settings, "ULTRANER_WEBHOOK_SECRET", "")
    if webhook_secret:
        sig_header = request.headers.get("X-Ultraner-Signature", "")
        secret_hash = hashlib.sha256(webhook_secret.encode()).hexdigest()
        expected_hex = hmac.new(
            secret_hash.encode(), request.body, hashlib.sha256
        ).hexdigest()
        expected = f"sha256={expected_hex}"
        if not hmac.compare_digest(sig_header, expected):
            return Response({"error": "Invalid signature."}, status=status.HTTP_401_UNAUTHORIZED)

    event = str(request.data.get("event", "")).strip()
    data = request.data.get("data") or {}
    merchant_reference = str(data.get("merchant_reference", "")).strip()

    if not merchant_reference:
        return Response({"error": "data.merchant_reference is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        txn = Transaction.objects.get(
            reference_number=merchant_reference, transaction_type="Deposit"
        )
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

    # Idempotent — ignore if already settled
    if txn.status in ("completed", "failed"):
        return Response({"status": f"already_{txn.status}"})

    if event == "payment.success":
        with db_transaction.atomic():
            txn.mark_completed()

        # Run goal distribution outside the atomic block so a goal error
        # cannot roll back the completed transaction.
        try:
            from apps.transactions.views import _distribute_to_goals
            _distribute_to_goals(txn.user, txn.net_amount)
        except Exception:
            pass

        _broadcast_deposit_updates(txn)

    elif event == "payment.failed":
        reason = str(data.get("failure_reason") or "Payment was not completed by the user.")
        txn.mark_failed(reason[:200])

    return Response({"status": "ok"})
