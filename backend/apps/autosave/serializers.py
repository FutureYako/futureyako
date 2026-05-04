from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import SavingPreference, DeductionLog, GoalWeight, OnboardingProgress


class SavingPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for saving preferences."""
    
    is_active = serializers.ReadOnlyField()
    days_until_next_deduction = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    funding_source_names = serializers.SerializerMethodField()

    def get_funding_source_names(self, obj):
        return list(obj.funding_sources.values_list('name', flat=True))
    
    class Meta:
        model = SavingPreference
        fields = [
            'id', 'amount', 'amount_type', 'frequency', 'duration_months',
            'funding_sources', 'funding_source_names', 'is_enabled',
            'next_deduction_at', 'commitment_end_at', 'is_active',
            'days_until_next_deduction', 'days_remaining',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'next_deduction_at', 'commitment_end_at', 'is_active',
            'days_until_next_deduction', 'days_remaining',
            'created_at', 'updated_at'
        ]
    
    def validate_duration_months(self, value):
        """Validate minimum duration."""
        if value < 4:
            raise serializers.ValidationError(
                "Minimum saving duration is 4 months."
            )
        return value
    
    def validate_funding_sources(self, value):
        """Validate funding sources belong to user."""
        request = self.context.get('request')
        if request and request.user:
            user_sources = request.user.wallet.funding_sources.filter(
                status='active'
            )
            valid_ids = set(str(source.id) for source in user_sources)
            provided_ids = set(str(source.id) for source in value)
            
            if not provided_ids.issubset(valid_ids):
                raise serializers.ValidationError(
                    "Some funding sources are invalid or not active."
                )
        return value
    
    def create(self, validated_data):
        """Create saving preference with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        preference = super().create(validated_data)
        
        # Update onboarding progress
        progress, created = OnboardingProgress.objects.get_or_create(user=user)
        progress.autosave_configured = True
        progress.update_progress()
        
        return preference


class SavingPreferenceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating saving preferences."""
    
    class Meta:
        model = SavingPreference
        fields = [
            'amount', 'amount_type', 'frequency', 'duration_months',
            'funding_sources', 'routing_preference'
        ]


class DeductionLogSerializer(serializers.ModelSerializer):
    """Serializer for deduction logs."""
    
    funding_source_name = serializers.CharField(
        source='funding_source.name', 
        read_only=True
    )
    can_retry = serializers.ReadOnlyField()
    
    class Meta:
        model = DeductionLog
        fields = [
            'id', 'preference', 'scheduled_at', 'executed_at',
            'amount', 'funding_source', 'funding_source_name',
            'status', 'failure_reason', 'retry_count',
            'next_retry_at', 'can_retry', 'created_at'
        ]
        read_only_fields = [
            'id', 'preference', 'scheduled_at', 'executed_at',
            'status', 'failure_reason', 'retry_count',
            'next_retry_at', 'can_retry', 'created_at'
        ]


class GoalWeightSerializer(serializers.ModelSerializer):
    """Serializer for goal weight allocations."""
    
    goal_name = serializers.CharField(source='goal.name', read_only=True)
    effective_weight = serializers.ReadOnlyField()
    
    class Meta:
        model = GoalWeight
        fields = [
            'id', 'goal', 'goal_name', 'weight_type', 'weight_value',
            'effective_weight', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'effective_weight', 'created_at', 'updated_at'
        ]
    
    def validate_goal(self, value):
        """Validate goal belongs to user and is a savings goal."""
        request = self.context.get('request')
        if request and request.user:
            if value.user != request.user:
                raise serializers.ValidationError(
                    "Goal must belong to the current user."
                )
            if value.type != 'savings':
                raise serializers.ValidationError(
                    "Only savings goals can have weight allocations."
                )
            if value.status != 'active':
                raise serializers.ValidationError(
                    "Goal must be active to receive auto-save allocations."
                )
        return value
    
    def create(self, validated_data):
        """Create goal weight with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class GoalWeightCreateSerializer(GoalWeightSerializer):
    """Serializer for creating goal weights (excludes read-only fields)."""
    
    class Meta(GoalWeightSerializer.Meta):
        read_only_fields = ['id', 'created_at', 'updated_at']


class OnboardingProgressSerializer(serializers.ModelSerializer):
    """Serializer for onboarding progress."""
    
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = OnboardingProgress
        fields = [
            'id', 'funding_source_added', 'goals_created',
            'autosave_configured', 'completed', 'completed_at',
            'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'completed', 'completed_at', 'completion_percentage',
            'created_at', 'updated_at'
        ]
