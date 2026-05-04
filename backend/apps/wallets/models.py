from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from common.models import BaseModel
from common.utils import generate_wallet_number


class Wallet(BaseModel):
    """User's main wallet holding all funds."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('frozen', 'Frozen'),
        ('closed', 'Closed'),
    ]
    
    user = models.OneToOneField(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='wallet'
    )
    wallet_number = models.CharField(
        max_length=20, 
        unique=True, 
        default=generate_wallet_number
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    
    class Meta:
        db_table = "wallets"
    
    @property
    def total_balance(self) -> Decimal:
        """Calculate total balance from all completed transactions."""
        from apps.transactions.models import Transaction
        completed_txns = Transaction.objects.filter(
            user=self.user, 
            status='completed'
        )
        
        total = Decimal('0')
        for txn in completed_txns:
            if txn.transaction_type in ['Deposit', 'Auto-Save', 'Return']:
                total += txn.net_amount
            elif txn.transaction_type in ['Withdrawal', 'Investment']:
                total -= txn.net_amount
        return total.quantize(Decimal('0.01'))
    
    @property
    def available_balance(self) -> Decimal:
        """Calculate available balance (total - locked funds)."""
        # For now, same as total. Will implement locked funds logic when needed
        return self.total_balance


class FundingSource(BaseModel):
    """Bank account or mobile money source for funding."""
    
    SOURCE_TYPE_CHOICES = [
        ('bank', 'Bank Account'),
        ('mobile', 'Mobile Money'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('verification_pending', 'Verification Pending'),
    ]
    
    wallet = models.ForeignKey(
        Wallet, 
        on_delete=models.CASCADE, 
        related_name='funding_sources'
    )
    source_type = models.CharField(
        max_length=20, 
        choices=SOURCE_TYPE_CHOICES
    )
    name = models.CharField(max_length=100)  # Bank name or provider name
    account_identifier = models.CharField(max_length=50)  # Account number or phone
    account_holder_name = models.CharField(max_length=100)
    is_primary = models.BooleanField(default=False)
    status = models.CharField(
        max_length=30, 
        choices=STATUS_CHOICES, 
        default='verification_pending'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "funding_sources"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary source per wallet
        if self.is_primary:
            FundingSource.objects.filter(
                wallet=self.wallet, 
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
    
    @property
    def masked_identifier(self) -> str:
        """Return masked account identifier for security."""
        if len(self.account_identifier) <= 4:
            return '*' * len(self.account_identifier)
        
        if self.source_type == 'bank':
            # Show last 4 digits for bank accounts
            return f"****{self.account_identifier[-4:]}"
        else:
            # Show partial for mobile money
            return f"{self.account_identifier[:3]}***{self.account_identifier[-2:]}"
