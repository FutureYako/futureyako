from rest_framework import serializers
from .models import Notification, BroadcastMessage, NotificationPreference, NotificationTemplate, NotificationQueue


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications."""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notif_type', 'is_read',
            'action_url', 'action_text', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications (admin use)."""
    
    user_email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'user_email', 'title', 'message', 'notif_type',
            'action_url', 'action_text'
        ]
    
    def validate_user_email(self, value):
        """Validate user exists."""
        from apps.accounts.models import User
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value
    
    def create(self, validated_data):
        """Create notification for specified user."""
        from apps.accounts.models import User
        
        user_email = validated_data.pop('user_email')
        user = User.objects.get(email=user_email)
        
        validated_data['user'] = user
        return super().create(validated_data)


class BroadcastMessageSerializer(serializers.ModelSerializer):
    """Serializer for broadcast messages."""
    
    created_by_email = serializers.CharField(
        source='created_by.email', 
        read_only=True
    )
    
    class Meta:
        model = BroadcastMessage
        fields = [
            'id', 'title', 'message', 'target_audience', 'notif_type',
            'sent_at', 'reach_count', 'created_by_email', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sent_at', 'reach_count', 'created_by_email',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        """Create broadcast with user from request context."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)


class BroadcastMessageCreateSerializer(BroadcastMessageSerializer):
    """Serializer for creating broadcast messages."""
    
    class Meta(BroadcastMessageSerializer.Meta):
        fields = [
            'title', 'message', 'target_audience', 'notif_type'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'in_app_enabled', 'email_enabled',
            'autosave_notifications', 'goal_notifications',
            'transaction_notifications', 'investment_notifications',
            'system_notifications', 'quiet_hours_enabled',
            'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        """Validate quiet hours logic."""
        quiet_hours_enabled = attrs.get('quiet_hours_enabled')
        quiet_hours_start = attrs.get('quiet_hours_start')
        quiet_hours_end = attrs.get('quiet_hours_end')
        
        if quiet_hours_enabled:
            if not quiet_hours_start or not quiet_hours_end:
                raise serializers.ValidationError(
                    "Both start and end times are required when quiet hours are enabled."
                )
        
        return attrs
    
    def create(self, validated_data):
        """Create preferences with user from request context."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates."""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'template_type', 'title_template', 'message_template',
            'action_url', 'action_text', 'notif_type', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at'
        ]


class NotificationQueueSerializer(serializers.ModelSerializer):
    """Serializer for notification queue."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationQueue
        fields = [
            'id', 'user', 'user_email', 'notification_type',
            'title', 'message', 'action_url', 'action_text',
            'notif_type', 'status', 'scheduled_at', 'sent_at',
            'error_message', 'retry_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'sent_at', 'error_message',
            'retry_count', 'created_at', 'updated_at'
        ]


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics."""
    
    total_notifications = serializers.IntegerField(read_only=True)
    unread_notifications = serializers.IntegerField(read_only=True)
    notification_types = serializers.DictField(read_only=True)
    recent_notifications = serializers.ListField(
        child=serializers.DictField(), 
        read_only=True
    )
    
    def to_representation(self, instance):
        """Generate notification statistics for user."""
        user = self.context['request'].user
        
        # Overall statistics
        total_notifications = user.notifications.count()
        unread_notifications = user.notifications.filter(is_read=False).count()
        
        # Notification type breakdown
        type_counts = {}
        for notif_type, label in Notification.TYPE_CHOICES:
            count = user.notifications.filter(notif_type=notif_type).count()
            type_counts[notif_type] = {
                'count': count,
                'label': label
            }
        
        # Recent notifications
        recent = user.notifications.order_by('-created_at')[:10]
        recent_data = NotificationSerializer(recent, many=True).data
        
        return {
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'notification_types': type_counts,
            'recent_notifications': recent_data
        }
