from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from common.models import BaseModel


class PlatformSettings(BaseModel):
    """Singleton model for platform-wide settings."""
    
    # Financial settings
    min_saving_duration_months = models.IntegerField(default=4)
    max_goals_per_user = models.IntegerField(default=10)
    platform_fee_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('3.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Feature toggles
    maintenance_mode_enabled = models.BooleanField(default=False)
    bank_linking_enabled = models.BooleanField(default=True)
    mobile_money_enabled = models.BooleanField(default=True)
    investments_enabled = models.BooleanField(default=True)
    group_goals_enabled = models.BooleanField(default=True)
    
    # System limits
    max_withdrawal_per_day = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('10000.00')
    )
    max_investment_per_user = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal('50000.00')
    )
    
    class Meta:
        db_table = "platform_settings"
    
    @classmethod
    def get_solo(cls):
        """Get or create the singleton instance."""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def save(self, *args, **kwargs):
        """Ensure only one instance exists."""
        self.pk = 1
        super().save(*args, **kwargs)


class SystemAlert(BaseModel):
    """System alerts for admin dashboard."""
    
    LEVEL_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    is_active = models.BooleanField(default=True)
    auto_dismiss_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    dismissed_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = "system_alerts"
        ordering = ['-created_at']
    
    def dismiss(self, user):
        """Dismiss the alert."""
        self.is_active = False
        self.dismissed_at = timezone.now()
        self.dismissed_by = user
        self.save()


class AdminActivityLog(BaseModel):
    """Log of admin actions for audit trail."""
    
    ACTION_CHOICES = [
        ('user_suspend', 'User Suspended'),
        ('user_activate', 'User Activated'),
        ('user_delete', 'User Deleted'),
        ('make_admin', 'Admin Granted'),
        ('revoke_admin', 'Admin Revoked'),
        ('withdrawal_approve', 'Withdrawal Approved'),
        ('withdrawal_reject', 'Withdrawal Rejected'),
        ('fund_create', 'Investment Fund Created'),
        ('fund_update', 'Investment Fund Updated'),
        ('fund_delete', 'Investment Fund Deleted'),
        ('settings_update', 'Settings Updated'),
        ('broadcast_send', 'Broadcast Sent'),
        ('alert_create', 'Alert Created'),
        ('alert_dismiss', 'Alert Dismissed'),
    ]
    
    admin_user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='admin_actions'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='admin_actions_target'
    )
    target_object_id = models.CharField(max_length=50, blank=True)
    target_object_type = models.CharField(max_length=50, blank=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = "admin_activity_logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin_user', 'action']),
            models.Index(fields=['target_user']),
            models.Index(fields=['created_at']),
        ]


class MonthlyStats(BaseModel):
    """Monthly platform statistics for reporting."""
    
    year = models.IntegerField()
    month = models.IntegerField()
    
    # User statistics
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    
    # Financial statistics
    total_savings = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    total_invested = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    platform_revenue = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    
    # Transaction statistics
    total_transactions = models.IntegerField(default=0)
    successful_transactions = models.IntegerField(default=0)
    failed_transactions = models.IntegerField(default=0)
    
    # Goal statistics
    active_goals = models.IntegerField(default=0)
    completed_goals = models.IntegerField(default=0)
    
    class Meta:
        db_table = "monthly_stats"
        unique_together = ['year', 'month']
        ordering = ['-year', '-month']
    
    @classmethod
    def generate_current_month_stats(cls):
        """Generate statistics for the current month."""
        from django.utils import timezone
        from apps.accounts.models import User
        from apps.transactions.models import Transaction
        from apps.goals.models import Goal
        from apps.investments.models import Investment
        
        now = timezone.now()
        year, month = now.year, now.month
        
        # Get or create stats record
        stats, created = cls.objects.get_or_create(
            year=year, 
            month=month
        )
        
        # Calculate user statistics
        stats.total_users = User.objects.count()
        stats.active_users = User.objects.filter(member_status='active').count()
        stats.new_users = User.objects.filter(
            created_at__year=year,
            created_at__month=month
        ).count()
        
        # Calculate financial statistics
        completed_txns = Transaction.objects.filter(
            status='completed',
            created_at__year=year,
            created_at__month=month
        )
        
        stats.total_transactions = completed_txns.count()
        stats.platform_revenue = completed_txns.aggregate(
            total=models.Sum('platform_fee')
        )['total'] or Decimal('0.00')
        
        # Calculate savings and investments
        stats.total_savings = completed_txns.filter(
            category='Savings'
        ).aggregate(
            total=models.Sum('net_amount')
        )['total'] or Decimal('0.00')
        
        stats.total_invested = completed_txns.filter(
            transaction_type='Investment'
        ).aggregate(
            total=models.Sum('net_amount')
        )['total'] or Decimal('0.00')
        
        # Calculate goal statistics
        stats.active_goals = Goal.objects.filter(status='active').count()
        stats.completed_goals = Goal.objects.filter(
            status='completed',
            updated_at__year=year,
            updated_at__month=month
        ).count()
        
        stats.save()
        return stats


class PaymentProvider(BaseModel):
    """Configurable list of supported banks and mobile money providers."""

    TYPE_CHOICES = [
        ('bank', 'Bank'),
        ('mobile', 'Mobile Money'),
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30, unique=True)
    provider_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    country = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "payment_providers"
        ordering = ['name']


class SystemHealth(BaseModel):
    """System health monitoring data."""
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
        ('down', 'Down'),
    ]
    
    service_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    response_time_ms = models.IntegerField(null=True, blank=True)
    error_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    last_check = models.DateTimeField(auto_now=True)
    details = models.JSONField(default=dict)
    
    class Meta:
        db_table = "system_health"
        unique_together = ['service_name']
        ordering = ['service_name']
    
    @classmethod
    def update_health(cls, service_name: str, status: str, **kwargs):
        """Update health status for a service."""
        health, created = cls.objects.get_or_create(
            service_name=service_name,
            defaults={'status': status}
        )
        
        health.status = status
        for key, value in kwargs.items():
            if hasattr(health, key):
                setattr(health, key, value)
        
        health.save()
        return health
