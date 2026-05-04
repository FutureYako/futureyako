from decimal import Decimal
from datetime import date, timedelta
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from common.models import BaseModel
from common.utils import generate_invitation_code


class Goal(BaseModel):
    """Unified model for all goal types (savings, emergency, group)."""
    
    GOAL_TYPE_CHOICES = [
        ('savings', 'Savings Goal'),
        ('emergency', 'Emergency Fund'),
        ('group', 'Group Goal'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    WEIGHT_TYPE_CHOICES = [
        ('Percentage', 'Percentage'),
        ('Fixed Amount', 'Fixed Amount'),
    ]
    
    # Group-specific choices
    GROUP_SUBTYPE_CHOICES = [
        ('loop', 'Loop/Susu'),
        ('wedding', 'Wedding'),
        ('community', 'Community'),
        ('coinvest', 'Co-Invest'),
        ('custom', 'Custom'),
    ]
    
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('invite', 'Invite Only'),
    ]
    
    CONTRIBUTION_MODEL_CHOICES = [
        ('open', 'Open Contribution'),
        ('split', 'Split Amount'),
    ]
    
    WITHDRAWAL_CONTROL_CHOICES = [
        ('admin', 'Admin Control'),
        ('consensus', 'Consensus'),
    ]
    
    # Common fields
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='goals'
    )
    type = models.CharField(
        max_length=20, 
        choices=GOAL_TYPE_CHOICES
    )
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=500, blank=True)
    target = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    current = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    
    # Savings goal specific fields
    deadline = models.DateField(null=True, blank=True)
    locked = models.BooleanField(default=False)
    weight = models.CharField(
        max_length=20, 
        default="0%"
    )
    
    # Group goal specific fields
    groupSubType = models.CharField(
        max_length=20, 
        choices=GROUP_SUBTYPE_CHOICES, 
        blank=True
    )
    visibility = models.CharField(
        max_length=20, 
        choices=VISIBILITY_CHOICES, 
        default='invite'
    )
    contributionModel = models.CharField(
        max_length=20, 
        choices=CONTRIBUTION_MODEL_CHOICES, 
        blank=True
    )
    withdrawalControl = models.CharField(
        max_length=20, 
        choices=WITHDRAWAL_CONTROL_CHOICES, 
        blank=True
    )
    code = models.CharField(
        max_length=8,
        unique=True,
        blank=True,
        null=True,
        default=None,
    )
    
    myContribution = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    
    class Meta:
        db_table = "goals"
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Only group goals get an invitation code; others must stay NULL
        if self.type == 'group' and not self.code:
            self.code = generate_invitation_code()
        elif self.type != 'group':
            self.code = None
        
        # Auto-complete goal when target is reached
        if self.current >= self.target and self.status == 'active':
            self.status = 'completed'
        
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validate goal-specific rules."""
        if self.type == 'savings':
            if not self.deadline:
                raise models.ValidationError("Savings goals must have a deadline.")
            if self.deadline <= date.today() + timedelta(days=120):
                raise models.ValidationError(
                    "Savings goal deadline must be at least 4 months from today."
                )
        elif self.type == 'emergency':
            if self.deadline:
                raise models.ValidationError("Emergency funds cannot have a deadline.")
            if self.locked:
                raise models.ValidationError("Emergency funds cannot be locked.")
        elif self.type == 'group':
            if not self.groupSubType:
                raise models.ValidationError("Group goals must specify a subtype.")
            if not self.contributionModel:
                raise models.ValidationError("Group goals must specify a contribution model.")
            if not self.withdrawalControl:
                raise models.ValidationError("Group goals must specify withdrawal control.")
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress as percentage."""
        if self.target == 0:
            return 0
        return float((self.current / self.target) * 100)

    @property
    def remaining_amount(self) -> Decimal:
        """Calculate remaining amount to reach target."""
        remaining = self.target - self.current
        return max(remaining, Decimal('0.00'))
    
    @property
    def days_remaining(self) -> int:
        """Calculate days remaining until deadline."""
        if not self.deadline:
            return 0
        today = date.today()
        if self.deadline <= today:
            return 0
        return (self.deadline - today).days
    
    def is_creator(self, user) -> bool:
        """Check if user is the creator of this group goal."""
        if self.type != 'group':
            return False
        return GroupParticipant.objects.filter(
            goal=self,
            user=user,
            is_creator=True
        ).exists()


class GroupParticipant(BaseModel):
    """Participants in group goals."""
    
    goal = models.ForeignKey(
        Goal, 
        on_delete=models.CASCADE, 
        related_name='participants'
    )
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='group_participations'
    )
    amount_contributed = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    is_creator = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "group_participants"
        unique_together = ['goal', 'user']
    
    @property
    def share_target(self) -> Decimal:
        """Calculate this participant's share target for split model."""
        if self.goal.contributionModel != 'split':
            return Decimal('0.00')

        participant_count = self.goal.participants.count()
        if participant_count == 0:
            return Decimal('0.00')

        return (self.goal.target / participant_count).quantize(Decimal('0.01'))
    
    @property
    def share_progress(self) -> float:
        """Calculate progress on share contribution."""
        share_target = self.share_target
        if share_target == 0:
            return 0
        return float((self.amount_contributed / share_target) * 100)


class WithdrawalRequest(BaseModel):
    """Withdrawal requests for group goals requiring consensus."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    goal = models.ForeignKey(
        Goal, 
        on_delete=models.CASCADE, 
        related_name='withdrawal_requests'
    )
    requested_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE
    )
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    justification = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "withdrawal_requests"
        ordering = ['-created_at']
    
    @property
    def approval_count(self) -> int:
        """Count of approval votes."""
        return self.votes.filter(vote='approve').count()
    
    @property
    def rejection_count(self) -> int:
        """Count of rejection votes."""
        return self.votes.filter(vote='reject').count()
    
    @property
    def total_votes(self) -> int:
        """Total votes cast."""
        return self.votes.count()
    
    @property
    def required_votes(self) -> int:
        """Total votes needed for consensus."""
        return self.goal.participants.count()
    
    @property
    def is_approved(self) -> bool:
        """Check if request has consensus approval."""
        if self.goal.withdrawalControl != 'consensus':
            return False
        return self.approval_count >= self.required_votes

    @property
    def is_rejected(self) -> bool:
        """Check if request is rejected by consensus."""
        if self.goal.withdrawalControl != 'consensus':
            return False
        return self.rejection_count >= self.required_votes


class WithdrawalVote(BaseModel):
    """Votes on group withdrawal requests."""
    
    VOTE_CHOICES = [
        ('approve', 'Approve'),
        ('reject', 'Reject'),
    ]
    
    withdrawal_req = models.ForeignKey(
        WithdrawalRequest, 
        on_delete=models.CASCADE, 
        related_name='votes'
    )
    participant = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE
    )
    vote = models.CharField(max_length=20, choices=VOTE_CHOICES)
    voted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "withdrawal_votes"
        unique_together = ['withdrawal_req', 'participant']
