from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from common.models import BaseModel
from common.utils import generate_investment_ref, compute_projected_return


class InvestmentFund(BaseModel):
    """Investment funds available for users to invest in."""
    
    CATEGORY_CHOICES = [
        ('Real Estate', 'Real Estate'),
        ('Agriculture', 'Agriculture'),
        ('Technology', 'Technology'),
        ('Energy', 'Energy'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    annual_roi = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    min_investment = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES)
    duration = models.CharField(max_length=50)  # e.g., "12–36 months"
    description = models.TextField()
    highlights = models.JSONField(default=list)  # List of strings
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "investment_funds"
        ordering = ['-created_at']
    
    @property
    def projected_return_example(self) -> Decimal:
        """Calculate projected return for minimum investment amount."""
        return compute_projected_return(self.min_investment, self.annual_roi)
    
    @property
    def investor_count(self) -> int:
        """Count of active investors in this fund."""
        return self.investments.filter(status='active').count()


class Investment(BaseModel):
    """User's investment holdings in specific funds."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('matured', 'Matured'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='investments'
    )
    fund = models.ForeignKey(
        InvestmentFund, 
        on_delete=models.CASCADE, 
        related_name='investments'
    )
    funding_source = models.ForeignKey(
        'wallets.FundingSource', 
        on_delete=models.PROTECT
    )
    amount_invested = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    projected_return = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        editable=False
    )
    projected_value = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        editable=False
    )
    current_value = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    reference_number = models.CharField(
        max_length=12, 
        unique=True, 
        default=generate_investment_ref
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    invested_at = models.DateTimeField(auto_now_add=True)
    matured_at = models.DateTimeField(null=True, blank=True)
    withdrawn_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "investments"
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Calculate projected returns and value
        self.projected_return = compute_projected_return(
            self.amount_invested, 
            self.fund.annual_roi
        )
        self.projected_value = self.amount_invested + self.projected_return
        
        super().save(*args, **kwargs)
    
    @property
    def roi_percentage(self) -> float:
        """Return on investment as percentage."""
        if self.current_value == 0:
            return 0.0
        return float(((self.current_value - self.amount_invested) / self.amount_invested) * 100)
    
    @property
    def days_invested(self) -> int:
        """Number of days since investment."""
        from django.utils import timezone
        return (timezone.now() - self.invested_at).days
    
    @property
    def is_matured(self) -> bool:
        """Check if investment has matured based on fund duration."""
        # This is a simplified check - in production, you'd parse the duration string
        # and calculate actual maturity date
        return self.days_invested >= 365  # Default to 1 year for simplicity


class PortfolioSnapshot(BaseModel):
    """Periodic portfolio value snapshots for performance tracking."""
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='portfolio_snapshots'
    )
    total_value = models.DecimalField(
        max_digits=14, 
        decimal_places=2
    )
    goals_value = models.DecimalField(
        max_digits=14, 
        decimal_places=2
    )
    emergency_value = models.DecimalField(
        max_digits=14, 
        decimal_places=2
    )
    investment_value = models.DecimalField(
        max_digits=14, 
        decimal_places=2
    )
    change_percentage = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    
    class Meta:
        db_table = "portfolio_snapshots"
        ordering = ['-created_at']
        unique_together = ['user', 'created_at']  # One snapshot per day per user
    
    @classmethod
    def create_snapshot(cls, user):
        """Create a daily portfolio snapshot for a user."""
        from apps.wallets.models import Wallet
        from apps.goals.models import Goal
        
        # Calculate current portfolio values
        wallet = Wallet.objects.get(user=user)
        
        # Goals value (savings + emergency goals)
        goals = Goal.objects.filter(user=user, status='active')
        goals_value = sum(goal.current for goal in goals)

        # Emergency fund value
        emergency_goals = goals.filter(type='emergency')
        emergency_value = sum(goal.current for goal in emergency_goals)
        
        # Investment value
        investments = user.investments.filter(status='active')
        investment_value = sum(inv.current_value for inv in investments)
        
        total_value = goals_value + investment_value
        
        # Calculate change from previous snapshot
        last_snapshot = cls.objects.filter(user=user).first()
        change_percentage = Decimal('0.00')
        if last_snapshot and last_snapshot.total_value > 0:
            change = total_value - last_snapshot.total_value
            change_percentage = (change / last_snapshot.total_value * 100).quantize(Decimal('0.01'))
        
        return cls.objects.create(
            user=user,
            total_value=total_value,
            goals_value=goals_value,
            emergency_value=emergency_value,
            investment_value=investment_value,
            change_percentage=change_percentage
        )
