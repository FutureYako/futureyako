from rest_framework import serializers
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from .models import (
    PlatformSettings, SystemAlert, AdminActivityLog,
    MonthlyStats, SystemHealth, PaymentProvider
)


class PlatformSettingsSerializer(serializers.ModelSerializer):
    """Serializer for platform settings."""
    
    class Meta:
        model = PlatformSettings
        fields = [
            'id', 'min_saving_duration_months', 'max_goals_per_user',
            'platform_fee_percentage', 'maintenance_mode_enabled',
            'bank_linking_enabled', 'mobile_money_enabled',
            'investments_enabled', 'group_goals_enabled',
            'max_withdrawal_per_day', 'max_investment_per_user',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_platform_fee_percentage(self, value):
        """Validate platform fee percentage."""
        if value < 0 or value > 50:
            raise serializers.ValidationError(
                "Platform fee percentage must be between 0 and 50."
            )
        return value
    
    def validate_min_saving_duration_months(self, value):
        """Validate minimum saving duration."""
        if value < 1 or value > 24:
            raise serializers.ValidationError(
                "Minimum saving duration must be between 1 and 24 months."
            )
        return value


class SystemAlertSerializer(serializers.ModelSerializer):
    """Serializer for system alerts."""
    
    dismissed_by_email = serializers.CharField(
        source='dismissed_by.email', 
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = SystemAlert
        fields = [
            'id', 'title', 'message', 'level', 'is_active',
            'auto_dismiss_at', 'dismissed_at', 'dismissed_by_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'dismissed_at', 'dismissed_by_email', 
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        """Create alert with user from request context."""
        user = self.context['request'].user
        # Log admin action
        AdminActivityLog.objects.create(
            admin_user=user,
            action='alert_create',
            details={'alert_title': validated_data['title']}
        )
        return super().create(validated_data)


class AdminActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for admin activity logs."""
    
    admin_user_email = serializers.CharField(source='admin_user.email', read_only=True)
    target_user_email = serializers.CharField(
        source='target_user.email', 
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = AdminActivityLog
        fields = [
            'id', 'admin_user', 'admin_user_email', 'action',
            'target_user', 'target_user_email', 'target_object_id',
            'target_object_type', 'details', 'ip_address', 'user_agent',
            'created_at'
        ]
        read_only_fields = [
            'id', 'admin_user', 'admin_user_email', 'created_at'
        ]


class MonthlyStatsSerializer(serializers.ModelSerializer):
    """Serializer for monthly statistics."""
    
    class Meta:
        model = MonthlyStats
        fields = [
            'id', 'year', 'month', 'total_users', 'active_users',
            'new_users', 'total_savings', 'total_invested',
            'platform_revenue', 'total_transactions',
            'successful_transactions', 'failed_transactions',
            'active_goals', 'completed_goals', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for system health data."""
    
    class Meta:
        model = SystemHealth
        fields = [
            'id', 'service_name', 'status', 'response_time_ms',
            'error_rate', 'last_check', 'details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_check', 'created_at', 'updated_at']


class PaymentProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProvider
        fields = ['id', 'name', 'code', 'provider_type', 'country', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class OverviewStatsSerializer(serializers.Serializer):
    """Serializer for admin overview statistics."""
    
    total_users = serializers.IntegerField(read_only=True)
    active_users = serializers.IntegerField(read_only=True)
    new_users_this_month = serializers.IntegerField(read_only=True)
    total_savings = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_invested = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    pending_withdrawals = serializers.IntegerField(read_only=True)
    platform_revenue = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    system_alerts = serializers.ListField(child=serializers.DictField(), read_only=True)
    
    def to_representation(self, instance):
        """Generate overview statistics."""
        from apps.accounts.models import User
        from apps.transactions.models import Transaction, WithdrawalRequest
        from apps.goals.models import Goal
        from apps.investments.models import Investment
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(member_status='active').count()
        
        now = timezone.now()
        new_users_this_month = User.objects.filter(
            created_at__year=now.year,
            created_at__month=now.month
        ).count()
        
        # Financial statistics
        completed_txns = Transaction.objects.filter(status='completed')
        total_savings = completed_txns.filter(category='Savings').aggregate(
            total=Sum('net_amount')
        )['total'] or Decimal('0.00')
        
        total_invested = Investment.objects.filter(status='active').aggregate(
            total=Sum('amount_invested')
        )['total'] or Decimal('0.00')
        
        platform_revenue = completed_txns.aggregate(
            total=Sum('platform_fee')
        )['total'] or Decimal('0.00')
        
        # Pending withdrawals
        pending_withdrawals = WithdrawalRequest.objects.filter(status='pending').count()
        
        # System alerts
        alerts = SystemAlert.objects.filter(is_active=True).order_by('-created_at')
        system_alerts = SystemAlertSerializer(alerts, many=True).data
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'new_users_this_month': new_users_this_month,
            'total_savings': total_savings,
            'total_invested': total_invested,
            'pending_withdrawals': pending_withdrawals,
            'platform_revenue': platform_revenue,
            'system_alerts': system_alerts
        }


class UserManagementSerializer(serializers.Serializer):
    """Serializer for user management data."""
    
    users = serializers.ListField(child=serializers.DictField(), read_only=True)
    total_count = serializers.IntegerField(read_only=True)
    active_count = serializers.IntegerField(read_only=True)
    suspended_count = serializers.IntegerField(read_only=True)
    
    def to_representation(self, instance):
        """Generate user management data."""
        from apps.accounts.models import User
        
        # Get query parameters
        search = self.context.get('search', '')
        status_filter = self.context.get('status', '')
        
        queryset = User.objects.all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(full_name__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(member_status=status_filter)
        
        # Statistics
        total_count = queryset.count()
        active_count = queryset.filter(member_status='active').count()
        suspended_count = queryset.filter(member_status='suspended').count()
        
        # User data
        users_data = []
        for user in queryset.order_by('-created_at')[:50]:
            try:
                wallet = user.wallet
                total_saved = float(wallet.total_balance) if wallet else 0.0
            except Exception:
                total_saved = 0.0
            users_data.append({
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'phone_number': user.phone_number or '',
                'member_status': user.member_status,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'total_saved': total_saved,
                'goals_count': user.goals.count() if hasattr(user, 'goals') else 0,
            })
        
        return {
            'users': users_data,
            'total_count': total_count,
            'active_count': active_count,
            'suspended_count': suspended_count
        }


class ChartDataSerializer(serializers.Serializer):
    """Serializer for chart data."""
    
    user_signups = serializers.ListField(child=serializers.DictField(), read_only=True)
    savings_volume = serializers.ListField(child=serializers.DictField(), read_only=True)
    investment_growth = serializers.ListField(child=serializers.DictField(), read_only=True)
    
    def to_representation(self, instance):
        """Generate chart data for admin dashboard."""
        from apps.accounts.models import User
        from apps.transactions.models import Transaction
        from apps.investments.models import Investment
        
        # User signups (last 12 months)
        user_signups = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=31)
            
            count = User.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            
            user_signups.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })
        
        # Savings volume (last 12 months)
        savings_volume = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=31)
            
            volume = Transaction.objects.filter(
                transaction_type='Auto-Save',
                status='completed',
                created_at__gte=month_start,
                created_at__lt=month_end
            ).aggregate(
                total=Sum('net_amount')
            )['total'] or Decimal('0.00')
            
            savings_volume.append({
                'month': month_start.strftime('%Y-%m'),
                'volume': float(volume)
            })
        
        # Investment growth (last 12 months)
        investment_growth = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=31)
            
            total = Investment.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).aggregate(
                total=Sum('amount_invested')
            )['total'] or Decimal('0.00')
            
            investment_growth.append({
                'month': month_start.strftime('%Y-%m'),
                'total': float(total)
            })
        
        user_signups_rev = list(reversed(user_signups))
        savings_volume_rev = list(reversed(savings_volume))

        return {
            'months': [entry['month'] for entry in user_signups_rev],
            'users': [entry['count'] for entry in user_signups_rev],
            'savings': [entry['volume'] for entry in savings_volume_rev],
            'user_signups': user_signups_rev,
            'savings_volume': savings_volume_rev,
            'investment_growth': list(reversed(investment_growth)),
        }
