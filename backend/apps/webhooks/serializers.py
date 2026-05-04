from rest_framework import serializers
from .models import Webhook, WebhookLog


class WebhookSerializer(serializers.ModelSerializer):
    """Serializer for webhook configuration."""
    
    class Meta:
        model = Webhook
        fields = [
            'id', 'name', 'url', 'event_type', 'secret', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_url(self, value):
        """Validate webhook URL."""
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value


class WebhookLogSerializer(serializers.ModelSerializer):
    """Serializer for webhook logs."""
    
    class Meta:
        model = WebhookLog
        fields = [
            'id', 'webhook', 'event_type', 'payload', 'response_status',
            'response_body', 'status', 'retry_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
