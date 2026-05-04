from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Webhook, WebhookLog
from .serializers import WebhookSerializer, WebhookLogSerializer
from .tasks import trigger_webhook


class WebhookViewSet(viewsets.ModelViewSet):
    """ViewSet for managing webhooks."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = WebhookSerializer
    
    def get_queryset(self):
        return Webhook.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test webhook by sending a test event."""
        webhook = self.get_object()
        test_payload = {
            "event": "test",
            "timestamp": "2024-01-01T00:00:00Z",
            "data": {"message": "This is a test webhook"}
        }
        
        try:
            trigger_webhook.delay(webhook.id, "test", test_payload)
            return Response({"message": "Test webhook triggered"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def logs(self, request):
        """Get webhook logs for the user."""
        logs = WebhookLog.objects.filter(
            webhook__user=request.user
        ).select_related('webhook')
        
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = WebhookLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = WebhookLogSerializer(logs, many=True)
        return Response(serializer.data)
