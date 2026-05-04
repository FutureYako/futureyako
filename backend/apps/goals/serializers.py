from rest_framework import serializers
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from .models import Goal, GroupParticipant, WithdrawalRequest, WithdrawalVote


class GoalSerializer(serializers.ModelSerializer):
    """Serializer for goals with calculated fields."""
    
    progress_percentage = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    is_creator = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = [
            'id', 'type', 'name', 'description', 'target', 
            'current', 'progress_percentage', 'remaining_amount',
            'deadline', 'days_remaining', 'locked', 'weight', 
            'groupSubType', 'visibility', 'contributionModel',
            'withdrawalControl', 'code', 'myContribution', 'status', 'is_creator',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'current', 'progress_percentage', 
            'remaining_amount', 'days_remaining', 'code',
            'status', 'created_at', 'updated_at'
        ]
    
    def get_is_creator(self, obj) -> bool:
        """Check if current user is creator of group goal."""
        request = self.context.get('request')
        if not request or not request.user:
            return False
        return obj.is_creator(request.user)
    
    def validate_deadline(self, value):
        """Validate deadline for savings goals."""
        goal_type = self.initial_data.get('type')
        if goal_type == 'savings' and value:
            if value <= date.today() + timedelta(days=120):
                raise serializers.ValidationError(
                    "Savings goal deadline must be at least 4 months from today."
                )
        elif goal_type == 'emergency' and value:
            raise serializers.ValidationError(
                "Emergency funds cannot have a deadline."
            )
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        goal_type = attrs.get('type')
        
        if goal_type == 'savings':
            if not attrs.get('deadline'):
                raise serializers.ValidationError({
                    'deadline': 'Savings goals must have a deadline.'
                })
        elif goal_type == 'emergency':
            if attrs.get('deadline'):
                raise serializers.ValidationError({
                    'deadline': 'Emergency funds cannot have a deadline.'
                })
            if attrs.get('locked'):
                raise serializers.ValidationError({
                    'locked': 'Emergency funds cannot be locked.'
                })
        elif goal_type == 'group':
            required_fields = ['groupSubType', 'contributionModel', 'withdrawalControl']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError({
                        field: f'Group goals must specify {field}.'
                    })
        
        return attrs
    
    def create(self, validated_data):
        """Create goal with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        goal = super().create(validated_data)

        if goal.type == 'group':
            GroupParticipant.objects.create(goal=goal, user=user, is_creator=True)
        else:
            # Auto-create GoalWeight from the goal's weight field
            self._sync_goal_weight(user, goal)

        return goal

    @staticmethod
    def _sync_goal_weight(user, goal):
        try:
            from apps.autosave.models import GoalWeight
            w_str = (goal.weight or '').strip()
            if not w_str or w_str in ('0%', '0'):
                return
            if w_str.endswith('%'):
                wt = 'Percentage'
                wv = Decimal(w_str[:-1])
            else:
                cleaned = w_str.replace('TSh', '').replace(',', '').strip()
                wt = 'Fixed Amount'
                wv = Decimal(cleaned)
            if wv > 0:
                GoalWeight.objects.update_or_create(
                    user=user, goal=goal,
                    defaults={'weight_type': wt, 'weight_value': wv, 'is_active': True},
                )
        except Exception:
            pass


class GoalCreateSerializer(GoalSerializer):
    """Serializer for creating goals (excludes read-only fields)."""
    
    class Meta(GoalSerializer.Meta):
        read_only_fields = [
            'id', 'current', 'progress_percentage', 
            'remaining_amount', 'days_remaining', 'code',
            'status', 'created_at', 'updated_at', 'is_creator'
        ]


class GroupParticipantSerializer(serializers.ModelSerializer):
    """Serializer for group participants."""
    
    share_target = serializers.ReadOnlyField()
    share_progress = serializers.ReadOnlyField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = GroupParticipant
        fields = [
            'id', 'user', 'user_email', 'user_full_name',
            'amount_contributed', 'share_target', 'share_progress',
            'is_creator', 'joined_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'share_target', 'share_progress', 
            'joined_at', 'created_at'
        ]


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """Serializer for withdrawal requests."""
    
    requested_by_email = serializers.EmailField(source='requested_by.email', read_only=True)
    approval_count = serializers.ReadOnlyField()
    rejection_count = serializers.ReadOnlyField()
    total_votes = serializers.ReadOnlyField()
    required_votes = serializers.ReadOnlyField()
    is_approved = serializers.ReadOnlyField()
    is_rejected = serializers.ReadOnlyField()
    
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'goal', 'requested_by', 'requested_by_email',
            'amount', 'justification', 'status', 'approval_count',
            'rejection_count', 'total_votes', 'required_votes',
            'is_approved', 'is_rejected', 'resolved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'requested_by', 'status', 'approval_count',
            'rejection_count', 'total_votes', 'required_votes',
            'is_approved', 'is_rejected', 'resolved_at',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        """Create withdrawal request with user from request context."""
        user = self.context['request'].user
        validated_data['requested_by'] = user
        return super().create(validated_data)


class WithdrawalVoteSerializer(serializers.ModelSerializer):
    """Serializer for withdrawal votes."""
    
    participant_email = serializers.EmailField(source='participant.email', read_only=True)
    
    class Meta:
        model = WithdrawalVote
        fields = [
            'id', 'withdrawal_req', 'participant', 'participant_email',
            'vote', 'voted_at', 'created_at'
        ]
        read_only_fields = ['id', 'voted_at', 'created_at']
    
    def create(self, validated_data):
        """Create vote with user from request context."""
        user = self.context['request'].user
        validated_data['participant'] = user
        return super().create(validated_data)


class GoalJoinSerializer(serializers.Serializer):
    """Serializer for joining group goals via invitation code."""
    
    code = serializers.CharField(max_length=8, required=True)
    
    def validate_code(self, value):
        """Validate invitation code and goal availability."""
        try:
            goal = Goal.objects.get(
                code=value.upper(),
                type='group',
                status='active'
            )
        except Goal.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid invitation code or goal is no longer active."
            )
        
        # Check if user is already a participant
        request = self.context.get('request')
        if request and request.user:
            if GroupParticipant.objects.filter(goal=goal, user=request.user).exists():
                raise serializers.ValidationError(
                    "You are already a participant in this goal."
                )
        
        self.goal = goal  # Store for later use
        return value
