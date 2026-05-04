from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum
from django.db import transaction as db_transaction
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Transaction, WithdrawalRequest, TransactionExport
from .serializers import (
    TransactionSerializer,
    WithdrawalRequestSerializer,
    TransactionExportSerializer,
    TransactionSummarySerializer
)


def _distribute_to_goals(user, deposit_amount: Decimal) -> list:
    """
    Allocate a deposit to the user's active goals based on their GoalWeight config.
    Percentage weights are applied against the full deposit amount.
    Fixed-amount weights are applied against whatever is left after percentages.
    Returns list of (goal, allocated_amount) for logging / response enrichment.
    """
    from apps.autosave.models import GoalWeight
    from apps.goals.models import Goal

    weights = list(
        GoalWeight.objects.filter(user=user, is_active=True, goal__status='active')
        .select_related('goal')
    )

    active_goals = list(Goal.objects.filter(
        user=user, status='active', type__in=['savings', 'emergency']
    ))
    if not active_goals:
        return []

    allocations = []

    if weights:
        remaining = deposit_amount
        for w in [w for w in weights if w.weight_type == 'Percentage']:
            alloc = min(
                (deposit_amount * w.weight_value / Decimal('100')).quantize(Decimal('0.01')),
                remaining,
            )
            if alloc > 0:
                allocations.append((w.goal, alloc))
                remaining -= alloc
        for w in [w for w in weights if w.weight_type == 'Fixed Amount']:
            alloc = min(w.weight_value, remaining)
            if alloc > 0:
                allocations.append((w.goal, alloc))
                remaining -= alloc
    else:
        # No GoalWeight records — distribute equally across active non-group goals
        per = (deposit_amount / Decimal(len(active_goals))).quantize(Decimal('0.01'))
        for g in active_goals:
            allocations.append((g, per))

    for goal, alloc in allocations:
        goal.current = (goal.current or Decimal('0')) + alloc
        goal.save(update_fields=['current', 'status', 'updated_at'])

    return allocations


class TransactionListView(generics.ListAPIView):
    """List transactions for the authenticated user with filtering."""
    
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'transaction_type', 'category', 'status', 
        'funding_source', 'destination_goal', 'destination_fund'
    ]
    search_fields = [
        'description', 'reference_number'
    ]
    ordering_fields = [
        'created_at', 'amount', 'net_amount', 'completed_at'
    ]
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        # Date range filtering
        queryset = Transaction.objects.filter(user=user)
        
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset


class TransactionDetailView(generics.RetrieveAPIView):
    """Retrieve transaction details."""
    
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(user=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_summary(request):
    """Get transaction summary statistics."""
    
    serializer = TransactionSummarySerializer(
        instance={},
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_transaction_export(request):
    """Request transaction data export."""
    
    serializer = TransactionExportSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    export = serializer.save()
    
    # Trigger async processing (in production, use Celery)
    # export.generate_export()
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_status(request, export_id):
    """Get status of transaction export."""
    
    user = request.user
    export = get_object_or_404(
        TransactionExport, 
        id=export_id, 
        user=user
    )
    
    serializer = TransactionExportSerializer(export)
    return Response(serializer.data, status=status.HTTP_200_OK)


class WithdrawalRequestListCreateView(generics.ListCreateAPIView):
    """List and create withdrawal requests."""
    
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'withdrawal_method']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return WithdrawalRequest.objects.filter(user=user)


class WithdrawalRequestDetailView(generics.RetrieveAPIView):
    """Retrieve withdrawal request details."""
    
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return WithdrawalRequest.objects.filter(user=user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_deposit_transaction(request):
    """Create a deposit transaction (for testing/manual deposits)."""
    
    amount = request.data.get('amount')
    description = request.data.get('description', 'Manual deposit')
    funding_source_id = request.data.get('funding_source')
    
    if not amount or not funding_source_id:
        return Response(
            {'error': 'Amount and funding source are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from apps.wallets.models import FundingSource
        funding_source = FundingSource.objects.get(
            id=funding_source_id,
            wallet__user=request.user,
            status__in=['active', 'verification_pending']
        )
    except FundingSource.DoesNotExist:
        return Response(
            {'error': 'Invalid or inactive funding source.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with db_transaction.atomic():
        transaction = Transaction.objects.create(
            user=request.user,
            transaction_type='Deposit',
            category='Savings',
            amount=amount,
            description=description,
            funding_source=funding_source,
            status='completed',
            completed_at=timezone.now()
        )
        allocations = _distribute_to_goals(request.user, Decimal(str(amount)))

    # Best-effort real-time updates — don't fail the response if Redis/Celery is down
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}_transactions",
            {
                "type": "transaction_created",
                "data": {
                    "id": transaction.id,
                    "transaction_type": transaction.transaction_type,
                    "amount": str(transaction.amount),
                    "net_amount": str(transaction.net_amount),
                    "status": transaction.status,
                    "description": transaction.description,
                    "created_at": transaction.created_at.isoformat(),
                }
            }
        )

        from apps.wallets.models import Wallet
        try:
            wallet = Wallet.objects.get(user=request.user)
            async_to_sync(channel_layer.group_send)(
                f"user_{request.user.id}_wallet",
                {
                    "type": "wallet_update",
                    "data": {
                        "total_balance": str(wallet.total_balance),
                        "available_balance": str(wallet.available_balance),
                    }
                }
            )
        except Wallet.DoesNotExist:
            pass

        for goal, alloc in allocations:
            async_to_sync(channel_layer.group_send)(
                f"user_{request.user.id}_goals",
                {
                    "type": "goal_update",
                    "data": {
                        "id": goal.id,
                        "name": goal.name,
                        "current": str(goal.current),
                        "target": str(goal.target),
                        "status": goal.status,
                    }
                }
            )
    except Exception:
        pass

    try:
        from apps.webhooks.tasks import broadcast_webhook_event
        broadcast_webhook_event.delay(
            "transaction.created",
            {
                "transaction_id": transaction.id,
                "type": transaction.transaction_type,
                "amount": str(transaction.amount),
                "user_id": request.user.id,
            },
            user_id=request.user.id
        )
        broadcast_webhook_event.delay(
            "wallet.deposit",
            {
                "amount": str(amount),
                "user_id": request.user.id,
                "funding_source": funding_source.name,
            },
            user_id=request.user.id
        )
    except Exception:
        pass

    serializer = TransactionSerializer(transaction, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_investment_transaction(request):
    """Create an investment transaction."""
    
    amount = request.data.get('amount')
    fund_id = request.data.get('fund_id')
    funding_source_id = request.data.get('funding_source')
    
    if not all([amount, fund_id, funding_source_id]):
        return Response(
            {'error': 'Amount, fund, and funding source are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from apps.investments.models import InvestmentFund
        from apps.wallets.models import FundingSource
        
        fund = InvestmentFund.objects.get(id=fund_id, is_active=True)
        funding_source = FundingSource.objects.get(
            id=funding_source_id,
            wallet__user=request.user,
            status='active'
        )
        
        if amount < fund.min_investment:
            return Response(
                {'error': f'Minimum investment is TSh {fund.min_investment:,.2f}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    except (InvestmentFund.DoesNotExist, FundingSource.DoesNotExist):
        return Response(
            {'error': 'Invalid fund or funding source.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create investment transaction
    transaction = Transaction.objects.create(
        user=request.user,
        transaction_type='Investment',
        category='Investment',
        amount=amount,
        description=f'Investment in {fund.name}',
        funding_source=funding_source,
        destination_fund=fund,
        status='completed',
        completed_at=timezone.now()
    )
    
    # Create investment record
    from apps.investments.models import Investment
    investment = Investment.objects.create(
        user=request.user,
        fund=fund,
        funding_source=funding_source,
        amount_invested=amount,
        current_value=amount  # Initially, current value equals invested amount
    )
    
    # Broadcast real-time updates via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{request.user.id}_transactions",
        {
            "type": "transaction_created",
            "data": {
                "id": transaction.id,
                "transaction_type": transaction.transaction_type,
                "amount": str(transaction.amount),
                "net_amount": str(transaction.net_amount),
                "status": transaction.status,
                "description": transaction.description,
                "created_at": transaction.created_at.isoformat(),
            }
        }
    )
    
    # Broadcast wallet update
    from apps.wallets.models import Wallet
    try:
        wallet = Wallet.objects.get(user=request.user)
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}_wallet",
            {
                "type": "wallet_update",
                "data": {
                    "total_balance": str(wallet.total_balance),
                    "available_balance": str(wallet.available_balance),
                }
            }
        )
    except Wallet.DoesNotExist:
        pass
    
    # Trigger webhooks
    from apps.webhooks.tasks import broadcast_webhook_event
    broadcast_webhook_event.delay(
        "transaction.created",
        {
            "transaction_id": transaction.id,
            "type": transaction.transaction_type,
            "amount": str(transaction.amount),
            "user_id": request.user.id,
        },
        user_id=request.user.id
    )
    broadcast_webhook_event.delay(
        "investment.created",
        {
            "investment_id": investment.id,
            "fund_id": fund.id,
            "fund_name": fund.name,
            "amount": str(amount),
            "user_id": request.user.id,
        },
        user_id=request.user.id
    )
    
    serializer = TransactionSerializer(transaction, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
