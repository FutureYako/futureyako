from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from common.models import BaseModel
from common.utils import generate_transaction_ref, apply_platform_fee


class Transaction(BaseModel):
    """Comprehensive transaction ledger for all financial activities."""
    
    TRANSACTION_TYPE_CHOICES = [
        ('Auto-Save', 'Auto-Save'),
        ('Investment', 'Investment'),
        ('Withdrawal', 'Withdrawal'),
        ('Deposit', 'Deposit'),
        ('Return', 'Investment Return'),
    ]
    
    CATEGORY_CHOICES = [
        ('Savings', 'Savings'),
        ('Investment', 'Investment'),
        ('Expense', 'Expense'),
    ]
    
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=20, 
        choices=TRANSACTION_TYPE_CHOICES
    )
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES
    )
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.CharField(max_length=200)
    
    # Optional relationships based on transaction type
    funding_source = models.ForeignKey(
        'wallets.FundingSource', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True
    )
    destination_goal = models.ForeignKey(
        'goals.Goal', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True
    )
    destination_fund = models.ForeignKey(
        'investments.InvestmentFund', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    reference_number = models.CharField(
        max_length=20, 
        unique=True, 
        default=generate_transaction_ref
    )
    platform_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    net_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2
    )
    
    # Processing timestamps
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.CharField(max_length=200, blank=True)
    
    class Meta:
        db_table = "transactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['transaction_type', 'status']),
            models.Index(fields=['reference_number']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # Ensure amount is always Decimal before arithmetic (JSON sends floats)
        amount = Decimal(str(self.amount)) if self.amount is not None else Decimal("0")

        if not self.platform_fee and amount:
            try:
                from apps.admin_panel.models import PlatformSettings
                settings = PlatformSettings.get_solo()
                fee_pct = Decimal(str(settings.platform_fee_percentage))
            except Exception:
                fee_pct = Decimal("0")
            self.platform_fee, self.net_amount = apply_platform_fee(amount, fee_pct)
        elif not self.net_amount:
            self.net_amount = amount - Decimal(str(self.platform_fee or 0))

        super().save(*args, **kwargs)
    
    def mark_completed(self):
        """Mark transaction as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.processed_at = timezone.now()
        self.save()
        
        # Update related balances/goals
        self._update_balances()
    
    def mark_failed(self, reason: str):
        """Mark transaction as failed."""
        self.status = 'failed'
        self.failure_reason = reason
        self.failed_at = timezone.now()
        self.processed_at = timezone.now()
        self.save()
    
    def _update_balances(self):
        """Update related balances based on transaction type."""
        if self.transaction_type == 'Auto-Save' and self.destination_goal:
            # Update goal current amount
            self.destination_goal.current += self.net_amount
            self.destination_goal.save()
        
        elif self.transaction_type == 'Withdrawal':
            # Withdrawals reduce wallet balance (handled by wallet model)
            pass
        
        elif self.transaction_type == 'Investment' and self.destination_fund:
            # Create investment record (handled by investment app)
            pass
        
        elif self.transaction_type == 'Return':
            # Investment returns increase investment current value
            # (handled by investment app)
            pass
    
    @property
    def is_credit(self) -> bool:
        """Check if transaction is a credit (adds to balance)."""
        return self.transaction_type in ['Deposit', 'Auto-Save', 'Return']
    
    @property
    def is_debit(self) -> bool:
        """Check if transaction is a debit (reduces balance)."""
        return self.transaction_type in ['Withdrawal', 'Investment']
    
    @property
    def effective_amount(self) -> Decimal:
        """Get effective amount (positive for credit, negative for debit)."""
        return self.net_amount if self.is_credit else -self.net_amount


class WithdrawalRequest(BaseModel):
    """User withdrawal requests requiring admin approval."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    METHOD_CHOICES = [
        ('Bank Transfer', 'Bank Transfer'),
        ('Mobile Money', 'Mobile Money'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='withdrawal_requests'
    )
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    withdrawal_method = models.CharField(
        max_length=20, 
        choices=METHOD_CHOICES
    )
    destination_source = models.ForeignKey(
        'wallets.FundingSource', 
        on_delete=models.PROTECT
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    admin_notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_withdrawals'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=200, blank=True)
    
    class Meta:
        db_table = "withdrawal_requests_extended"
        ordering = ['-created_at']
    
    def approve(self, admin_user):
        """Approve withdrawal request."""
        self.status = 'approved'
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.save()
        
        # Create withdrawal transaction
        Transaction.objects.create(
            user=self.user,
            transaction_type='Withdrawal',
            category='Expense',
            amount=self.amount,
            description=f'Withdrawal to {self.destination_source.name}',
            funding_source=self.destination_source,
            status='completed',
            completed_at=timezone.now()
        )
    
    def reject(self, admin_user, reason: str):
        """Reject withdrawal request."""
        self.status = 'rejected'
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def mark_completed(self):
        """Mark withdrawal as completed (after external processing)."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


class TransactionExport(BaseModel):
    """Track transaction export requests."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('json', 'JSON'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='transaction_exports'
    )
    format = models.CharField(
        max_length=10, 
        choices=FORMAT_CHOICES
    )
    date_from = models.DateField()
    date_to = models.DateField()
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    file_path = models.CharField(max_length=500, blank=True)
    record_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = "transaction_exports"
        ordering = ['-created_at']
    
    def generate_export(self):
        """Generate the export file."""
        try:
            self.status = 'processing'
            self.save()
            
            # Get transactions in date range
            transactions = Transaction.objects.filter(
                user=self.user,
                created_at__date__gte=self.date_from,
                created_at__date__lte=self.date_to,
                status='completed'
            )
            
            self.record_count = transactions.count()
            
            if self.format == 'csv':
                self.file_path = self._generate_csv(transactions)
            else:
                self.file_path = self._generate_json(transactions)
            
            self.status = 'completed'
            self.save()
            
        except Exception as e:
            self.status = 'failed'
            self.error_message = str(e)
            self.save()
    
    def _generate_csv(self, transactions):
        """Generate CSV export."""
        import csv
        import io
        from django.core.files.base import ContentFile
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Reference Number', 'Type', 'Category', 'Amount', 'Platform Fee',
            'Net Amount', 'Description', 'Status', 'Date Created'
        ])
        
        # Write data
        for txn in transactions:
            writer.writerow([
                txn.reference_number,
                txn.transaction_type,
                txn.category,
                txn.amount,
                txn.platform_fee,
                txn.net_amount,
                txn.description,
                txn.status,
                txn.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        # Save to file (in production, use S3 or similar)
        filename = f"transactions_{self.user.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        # For now, just return the filename
        return filename
    
    def _generate_json(self, transactions):
        """Generate JSON export."""
        import json
        
        data = []
        for txn in transactions:
            data.append({
                'reference_number': txn.reference_number,
                'transaction_type': txn.transaction_type,
                'category': txn.category,
                'amount': str(txn.amount),
                'platform_fee': str(txn.platform_fee),
                'net_amount': str(txn.net_amount),
                'description': txn.description,
                'status': txn.status,
                'created_at': txn.created_at.isoformat(),
                'completed_at': txn.completed_at.isoformat() if txn.completed_at else None
            })
        
        filename = f"transactions_{self.user.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.json"
        # For now, just return the filename
        return filename
