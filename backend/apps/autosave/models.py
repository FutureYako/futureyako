from decimal import Decimal
from datetime import timedelta
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from common.models import BaseModel
from common.utils import compute_next_deduction, compute_retry_time, RETRY_DELAYS_SECONDS


class SavingPreference(BaseModel):
    """User's auto-saving preferences and schedule."""
    
    AMOUNT_TYPE_CHOICES = [
        ('Percentage', 'Percentage'),
        ('Fixed Amount', 'Fixed Amount'),
    ]
    
    FREQUENCY_CHOICES = [
        ('Daily', 'Daily'),
        ('Weekly', 'Weekly'),
        ('Monthly', 'Monthly'),
        ('Every 2 Months', 'Every 2 Months'),
    ]
    
    ROUTING_PREFERENCE_CHOICES = [
        ('wallet', 'Savings Wallet'),
        ('invest', 'Direct to Investment'),
    ]
    
    user = models.OneToOneField(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='saving_preference'
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    amount_type = models.CharField(
        max_length=20, 
        choices=AMOUNT_TYPE_CHOICES
    )
    frequency = models.CharField(
        max_length=20, 
        choices=FREQUENCY_CHOICES
    )
    duration_months = models.IntegerField(
        validators=[MinValueValidator(4)]
    )
    funding_sources = models.ManyToManyField(
        'wallets.FundingSource', 
        related_name='saving_preferences'
    )
    routing_preference = models.CharField(
        max_length=20,
        choices=ROUTING_PREFERENCE_CHOICES,
        default='wallet'
    )
    is_enabled = models.BooleanField(default=True)
    next_deduction_at = models.DateTimeField()
    commitment_end_at = models.DateTimeField()
    
    class Meta:
        db_table = "saving_preferences"
    
    def save(self, *args, **kwargs):
        # Calculate commitment end date if not set
        if not self.commitment_end_at:
            self.commitment_end_at = timezone.now() + timedelta(days=self.duration_months * 30)
        
        # Calculate next deduction date if not set
        if not self.next_deduction_at:
            self.next_deduction_at = compute_next_deduction(self.frequency)
        
        super().save(*args, **kwargs)
    
    @property
    def is_active(self) -> bool:
        """Check if preference is currently active."""
        now = timezone.now()
        return (
            self.is_enabled and 
            now < self.commitment_end_at and
            now >= self.next_deduction_at
        )
    
    @property
    def days_until_next_deduction(self) -> int:
        """Days until next deduction."""
        if self.next_deduction_at <= timezone.now():
            return 0
        delta = self.next_deduction_at - timezone.now()
        return delta.days
    
    @property
    def days_remaining(self) -> int:
        """Days remaining in commitment."""
        if self.commitment_end_at <= timezone.now():
            return 0
        delta = self.commitment_end_at - timezone.now()
        return delta.days
    
    def advance_next_deduction(self):
        """Advance next_deduction_at by frequency."""
        self.next_deduction_at = compute_next_deduction(
            self.frequency, 
            from_dt=self.next_deduction_at
        )
        self.save()


class DeductionLog(BaseModel):
    """Log of auto-save deduction attempts and results."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='deduction_logs'
    )
    preference = models.ForeignKey(
        SavingPreference, 
        on_delete=models.CASCADE, 
        related_name='deduction_logs'
    )
    scheduled_at = models.DateTimeField()
    executed_at = models.DateTimeField(null=True, blank=True)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    funding_source = models.ForeignKey(
        'wallets.FundingSource', 
        on_delete=models.PROTECT
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    failure_reason = models.CharField(
        max_length=200, 
        blank=True
    )
    retry_count = models.IntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "deduction_logs"
        ordering = ['-created_at']
    
    @property
    def can_retry(self) -> bool:
        """Check if this deduction can be retried."""
        return (
            self.status == 'failed' and 
            self.retry_count < 3 and
            self.next_retry_at and
            self.next_retry_at <= timezone.now()
        )
    
    def schedule_retry(self):
        """Schedule next retry attempt."""
        if self.retry_count < 3:
            self.retry_count += 1
            self.next_retry_at = compute_retry_time(self.retry_count)
            self.save()
            return True
        return False
    
    def mark_completed(self):
        """Mark deduction as completed."""
        self.status = 'completed'
        self.executed_at = timezone.now()
        self.next_retry_at = None
        self.save()
    
    def mark_failed(self, reason: str):
        """Mark deduction as failed and schedule retry if possible."""
        self.status = 'failed'
        self.failure_reason = reason
        self.executed_at = timezone.now()
        
        if not self.schedule_retry():
            # Max retries reached, no more retries
            self.next_retry_at = None
        
        self.save()


class GoalWeight(BaseModel):
    """Weight allocation for savings goals in auto-save distribution."""
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='goal_weights'
    )
    goal = models.ForeignKey(
        'goals.Goal', 
        on_delete=models.CASCADE, 
        related_name='weights'
    )
    weight_type = models.CharField(
        max_length=20, 
        choices=SavingPreference.AMOUNT_TYPE_CHOICES
    )
    weight_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "goal_weights"
        unique_together = ['user', 'goal']
    
    @property
    def effective_weight(self) -> Decimal:
        """Get the effective weight value."""
        return self.weight_value if self.is_active else Decimal('0.00')


class OnboardingProgress(BaseModel):
    """Track user onboarding completion status."""
    
    user = models.OneToOneField(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='onboarding_progress'
    )
    funding_source_added = models.BooleanField(default=False)
    goals_created = models.BooleanField(default=False)
    autosave_configured = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "onboarding_progress_extended"
    
    def update_progress(self):
        """Update overall completion status."""
        if (
            self.funding_source_added and 
            self.goals_created and 
            self.autosave_configured
        ):
            self.completed = True
            self.completed_at = timezone.now()
            self.save()
    
    @property
    def completion_percentage(self) -> int:
        """Calculate completion percentage."""
        steps = [
            self.funding_source_added,
            self.goals_created,
            self.autosave_configured
        ]
        completed_steps = sum(steps)
        return int((completed_steps / len(steps)) * 100)
