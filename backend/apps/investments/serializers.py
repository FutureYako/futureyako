from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from django.core.validators import MinValueValidator
from .models import InvestmentFund, Investment, PortfolioSnapshot


class InvestmentFundSerializer(serializers.ModelSerializer):
    """Serializer for investment funds."""
    
    projected_return_example = serializers.ReadOnlyField()
    investor_count = serializers.ReadOnlyField()
    
    class Meta:
        model = InvestmentFund
        fields = [
            'id', 'name', 'category', 'annual_roi', 'min_investment',
            'risk_level', 'duration', 'description', 'highlights',
            'is_active', 'projected_return_example', 'investor_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'projected_return_example', 'investor_count',
            'created_at', 'updated_at'
        ]


class InvestmentReviewSerializer(serializers.Serializer):
    """Serializer for investment preview (no save)."""
    
    fund_id = serializers.UUIDField()
    amount = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    funding_source_id = serializers.UUIDField()
    
    def validate_amount(self, value):
        """Validate investment amount."""
        fund_id = self.initial_data.get('fund_id')
        if fund_id:
            try:
                fund = InvestmentFund.objects.get(id=fund_id)
                if value < fund.min_investment:
                    raise serializers.ValidationError(
                        f"Minimum investment amount is TSh {fund.min_investment:,.2f}."
                    )
            except InvestmentFund.DoesNotExist:
                raise serializers.ValidationError("Invalid fund selected.")
        return value
    
    def validate_funding_source_id(self, value):
        """Validate funding source belongs to user."""
        request = self.context.get('request')
        if request and request.user:
            try:
                from apps.wallets.models import FundingSource
                source = FundingSource.objects.get(
                    id=value, 
                    wallet__user=request.user
                )
                if source.status != 'active':
                    raise serializers.ValidationError(
                        "Selected funding source is not active."
                    )
            except FundingSource.DoesNotExist:
                raise serializers.ValidationError(
                    "Invalid funding source selected."
                )
        return value
    
    def calculate_projections(self):
        """Calculate investment projections."""
        fund_id = self.validated_data['fund_id']
        amount = self.validated_data['amount']
        
        fund = InvestmentFund.objects.get(id=fund_id)
        projected_return = (amount * fund.annual_roi / 100).quantize(Decimal('0.01'))
        projected_value = amount + projected_return
        
        return {
            'fund': InvestmentFundSerializer(fund).data,
            'amount_invested': amount,
            'projected_return': projected_return,
            'projected_value': projected_value,
            'annual_roi': fund.annual_roi,
            'duration': fund.duration,
            'risk_level': fund.risk_level
        }


class InvestmentSerializer(serializers.ModelSerializer):
    """Serializer for user investments."""
    
    fund_details = InvestmentFundSerializer(source='fund', read_only=True)
    roi_percentage = serializers.ReadOnlyField()
    days_invested = serializers.ReadOnlyField()
    is_matured = serializers.ReadOnlyField()
    funding_source_name = serializers.CharField(source='funding_source.name', read_only=True)
    
    class Meta:
        model = Investment
        fields = [
            'id', 'fund', 'fund_details', 'funding_source', 'funding_source_name',
            'amount_invested', 'projected_return', 'projected_value',
            'current_value', 'roi_percentage', 'reference_number',
            'status', 'invested_at', 'days_invested', 'is_matured',
            'matured_at', 'withdrawn_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'projected_return', 'projected_value', 'current_value',
            'roi_percentage', 'reference_number', 'invested_at',
            'days_invested', 'is_matured', 'matured_at', 'withdrawn_at',
            'created_at', 'updated_at'
        ]
    
    def validate_fund(self, value):
        """Validate fund is active."""
        if not value.is_active:
            raise serializers.ValidationError("This fund is no longer active.")
        return value
    
    def create(self, validated_data):
        """Create investment with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class InvestmentCreateSerializer(InvestmentSerializer):
    """Serializer for creating investments (includes sensitive fields)."""
    
    class Meta(InvestmentSerializer.Meta):
        fields = [
            'fund', 'funding_source', 'amount_invested'
        ]


class PortfolioSummarySerializer(serializers.Serializer):
    """Serializer for portfolio summary."""
    
    total_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    change_percentage = serializers.DecimalField(max_digits=8, decimal_places=2)
    breakdown = serializers.ListField(
        child=serializers.DictField(),
        read_only=True
    )
    holdings = InvestmentSerializer(source='investments', many=True, read_only=True)
    monthly_returns = serializers.ListField(
        child=serializers.DictField(),
        read_only=True
    )
    
    def to_representation(self, instance):
        """Generate portfolio summary data."""
        user = self.context['request'].user
        from apps.wallets.models import Wallet
        from apps.goals.models import Goal
        
        # Get wallet and calculate values
        wallet = Wallet.objects.get(user=user)
        
        # Goals breakdown
        goals = Goal.objects.filter(user=user, status='active')
        savings_goals = goals.filter(type='savings')
        emergency_goals = goals.filter(type='emergency')

        savings_value = sum(goal.current for goal in savings_goals)
        emergency_value = sum(goal.current for goal in emergency_goals)
        
        # Investment value
        investments = user.investments.filter(status='active')
        investment_value = sum(inv.current_value for inv in investments)
        total_invested = sum(inv.amount_invested for inv in investments)

        total_value = savings_value + emergency_value + investment_value

        # Create breakdown
        breakdown = []
        if savings_value > 0:
            breakdown.append({
                'label': 'Goals',
                'amount': savings_value,
                'pct': round((savings_value / total_value * 100), 1) if total_value > 0 else 0
            })
        if emergency_value > 0:
            breakdown.append({
                'label': 'Emergency',
                'amount': emergency_value,
                'pct': round((emergency_value / total_value * 100), 1) if total_value > 0 else 0
            })
        if investment_value > 0:
            breakdown.append({
                'label': 'Investment',
                'amount': investment_value,
                'pct': round((investment_value / total_value * 100), 1) if total_value > 0 else 0
            })

        # Get latest change percentage
        latest_snapshot = PortfolioSnapshot.objects.filter(user=user).first()
        change_percentage = latest_snapshot.change_percentage if latest_snapshot else 0

        # Monthly returns from snapshots, fall back to empty list
        snapshots = PortfolioSnapshot.objects.filter(user=user).order_by('created_at')[:6]
        monthly_returns = [
            {'month': s.created_at.strftime('%b'), 'value': float(s.total_value)}
            for s in snapshots
        ]

        return {
            'total_value': total_value,
            'total_invested': total_invested,
            'current_value': investment_value,
            'change_percentage': change_percentage,
            'breakdown': breakdown,
            'holdings': InvestmentSerializer(investments, many=True, context=self.context).data,
            'monthly_returns': monthly_returns,
        }


class PortfolioAllocationSerializer(serializers.Serializer):
    """Serializer for portfolio allocation by category."""
    
    allocation = serializers.ListField(
        child=serializers.DictField(),
        read_only=True
    )
    
    def to_representation(self, instance):
        """Generate allocation breakdown."""
        user = self.context['request'].user
        from apps.goals.models import Goal
        
        # Get goals by category
        goals = Goal.objects.filter(user=user, status='active')
        
        # Group by category
        categories = {}
        for goal in goals:
            if goal.type == 'savings':
                category = 'Savings Goals'
            elif goal.type == 'emergency':
                category = 'Emergency Fund'
            else:
                category = 'Other'

            if category not in categories:
                categories[category] = Decimal('0.00')
            categories[category] += goal.current
        
        # Add investments
        investments = user.investments.filter(status='active')
        investment_total = sum(inv.current_value for inv in investments)
        if investment_total > 0:
            categories['Investments'] = investment_total
        
        # Convert to percentage breakdown
        total = sum(categories.values())
        allocation = []
        for category, amount in categories.items():
            allocation.append({
                'category': category,
                'amount': amount,
                'percentage': round((amount / total * 100), 1) if total > 0 else 0
            })
        
        return {'allocation': allocation}


class PortfolioSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for portfolio snapshots."""
    
    class Meta:
        model = PortfolioSnapshot
        fields = [
            'id', 'total_value', 'goals_value', 'emergency_value',
            'investment_value', 'change_percentage', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
