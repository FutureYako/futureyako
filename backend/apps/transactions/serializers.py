from rest_framework import serializers
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Sum
from .models import Transaction, WithdrawalRequest, TransactionExport


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions."""
    
    is_credit = serializers.ReadOnlyField()
    is_debit = serializers.ReadOnlyField()
    effective_amount = serializers.ReadOnlyField()
    funding_source_name = serializers.CharField(
        source='funding_source.name', 
        read_only=True,
        allow_null=True
    )
    destination_goal_name = serializers.CharField(
        source='destination_goal.name', 
        read_only=True,
        allow_null=True
    )
    destination_fund_name = serializers.CharField(
        source='destination_fund.name', 
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'category', 'amount', 'platform_fee',
            'net_amount', 'effective_amount', 'description', 'status',
            'reference_number', 'funding_source', 'funding_source_name',
            'destination_goal', 'destination_goal_name',
            'destination_fund', 'destination_fund_name',
            'is_credit', 'is_debit', 'processed_at', 'completed_at',
            'failed_at', 'failure_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reference_number', 'platform_fee', 'net_amount',
            'effective_amount', 'is_credit', 'is_debit', 'processed_at',
            'completed_at', 'failed_at', 'failure_reason', 'created_at', 'updated_at'
        ]
    
    def validate_amount(self, value):
        """Validate transaction amount."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value
    
    def create(self, validated_data):
        """Create transaction with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """Serializer for withdrawal requests."""
    
    destination_source_name = serializers.CharField(
        source='destination_source.name', 
        read_only=True
    )
    approved_by_email = serializers.CharField(
        source='approved_by.email', 
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'amount', 'withdrawal_method', 'destination_source',
            'destination_source_name', 'status', 'admin_notes',
            'approved_by', 'approved_by_email', 'approved_at',
            'completed_at', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'approved_by', 'approved_by_email',
            'approved_at', 'completed_at', 'rejection_reason',
            'created_at', 'updated_at'
        ]
    
    def validate_amount(self, value):
        """Validate withdrawal amount against available balance."""
        user = self.context['request'].user
        from apps.wallets.models import Wallet
        
        wallet = Wallet.objects.get(user=user)
        if value > wallet.available_balance:
            raise serializers.ValidationError(
                f"Insufficient balance. Available: TSh {wallet.available_balance:,.2f}"
            )
        return value
    
    def validate_destination_source(self, value):
        """Validate funding source belongs to user and is active."""
        user = self.context['request'].user
        if value.wallet.user != user:
            raise serializers.ValidationError(
                "Funding source must belong to the current user."
            )
        if value.status != 'active':
            raise serializers.ValidationError(
                "Funding source must be active."
            )
        return value
    
    def create(self, validated_data):
        """Create withdrawal request with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        withdrawal = super().create(validated_data)
        
        # Broadcast real-time updates via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}_wallet",
            {
                "type": "withdrawal_requested",
                "data": {
                    "id": withdrawal.id,
                    "amount": str(withdrawal.amount),
                    "status": withdrawal.status,
                    "withdrawal_method": withdrawal.withdrawal_method,
                }
            }
        )
        
        # Trigger webhooks
        from apps.webhooks.tasks import broadcast_webhook_event
        broadcast_webhook_event.delay(
            "wallet.withdrawal",
            {
                "withdrawal_id": withdrawal.id,
                "amount": str(withdrawal.amount),
                "user_id": user.id,
            },
            user_id=user.id
        )
        
        return withdrawal


class TransactionExportSerializer(serializers.ModelSerializer):
    """Serializer for transaction export requests."""
    
    class Meta:
        model = TransactionExport
        fields = [
            'id', 'format', 'date_from', 'date_to', 'status',
            'file_path', 'record_count', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'file_path', 'record_count',
            'error_message', 'created_at', 'updated_at'
        ]
    
    def validate_date_from(self, value):
        """Validate date range."""
        if value > date.today():
            raise serializers.ValidationError(
                "Date from cannot be in the future."
            )
        return value
    
    def validate_date_to(self, value):
        """Validate date range."""
        if value > date.today():
            raise serializers.ValidationError(
                "Date to cannot be in the future."
            )
        return value
    
    def validate(self, attrs):
        """Validate date range logic."""
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError(
                "Date from must be before or equal to date to."
            )
        
        # Limit export range to 1 year
        if date_from and date_to:
            days_diff = (date_to - date_from).days
            if days_diff > 365:
                raise serializers.ValidationError(
                    "Export range cannot exceed 1 year."
                )
        
        return attrs
    
    def create(self, validated_data):
        """Create export request with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Create export and start processing
        export = super().create(validated_data)
        
        # Trigger async processing (in production, use Celery)
        # export.generate_export()
        
        return export


class TransactionSummarySerializer(serializers.Serializer):
    """Serializer for transaction summary statistics."""
    
    total_transactions = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_fees = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    net_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    transaction_type_summary = serializers.DictField(read_only=True)
    category_summary = serializers.DictField(read_only=True)
    monthly_summary = serializers.ListField(child=serializers.DictField(), read_only=True)
    
    def to_representation(self, instance):
        """Generate transaction summary for user."""
        user = self.context['request'].user
        
        # Base queryset
        transactions = Transaction.objects.filter(
            user=user, 
            status='completed'
        )
        
        # Overall statistics
        total_transactions = transactions.count()
        total_amount = transactions.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_fees = transactions.aggregate(
            total=Sum('platform_fee')
        )['total'] or Decimal('0.00')
        
        net_total = transactions.aggregate(
            total=Sum('net_amount')
        )['total'] or Decimal('0.00')
        
        # Transaction type summary
        type_summary = {}
        for txn_type, label in Transaction.TRANSACTION_TYPE_CHOICES:
            amount = transactions.filter(transaction_type=txn_type).aggregate(
                total=Sum('net_amount')
            )['total'] or Decimal('0.00')
            count = transactions.filter(transaction_type=txn_type).count()
            if amount > 0 or count > 0:
                type_summary[txn_type] = {
                    'amount': amount,
                    'count': count,
                    'label': label
                }
        
        # Category summary
        category_summary = {}
        for category, label in Transaction.CATEGORY_CHOICES:
            amount = transactions.filter(category=category).aggregate(
                total=Sum('net_amount')
            )['total'] or Decimal('0.00')
            count = transactions.filter(category=category).count()
            if amount > 0 or count > 0:
                category_summary[category] = {
                    'amount': amount,
                    'count': count,
                    'label': label
                }
        
        # Monthly summary (last 6 months)
        monthly_summary = []
        for i in range(6):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=31)
            
            month_txns = transactions.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            )
            
            month_amount = month_txns.aggregate(
                total=Sum('net_amount')
            )['total'] or Decimal('0.00')
            
            monthly_summary.append({
                'month': month_start.strftime('%Y-%m'),
                'amount': month_amount,
                'count': month_txns.count()
            })
        
        return {
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'total_fees': total_fees,
            'net_total': net_total,
            'transaction_type_summary': type_summary,
            'category_summary': category_summary,
            'monthly_summary': monthly_summary
        }
