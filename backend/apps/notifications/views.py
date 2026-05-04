from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.db.models import Count
from .models import Notification, BroadcastMessage, NotificationPreference, NotificationTemplate, NotificationQueue
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    BroadcastMessageSerializer,
    BroadcastMessageCreateSerializer,
    NotificationPreferenceSerializer,
    NotificationTemplateSerializer,
    NotificationQueueSerializer,
    NotificationStatsSerializer
)


class NotificationListView(generics.ListAPIView):
    """List notifications for the authenticated user."""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['notif_type', 'is_read']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(user=user)


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific notification."""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return NotificationSerializer
        return NotificationSerializer


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """Mark a specific notification as read."""
    
    user = request.user
    notification = get_object_or_404(
        Notification, 
        id=pk, 
        user=user
    )
    
    notification.mark_as_read()
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the user."""
    
    user = request.user
    updated_count = user.notifications.filter(is_read=False).update(is_read=True)
    
    return Response({
        'message': f'Marked {updated_count} notifications as read.',
        'updated_count': updated_count
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    """Delete a specific notification."""
    
    user = request.user
    notification = get_object_or_404(
        Notification, 
        id=pk, 
        user=user
    )
    
    notification.delete()
    
    return Response(
        {'message': 'Notification deleted successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """Get notification statistics for the user."""
    
    serializer = NotificationStatsSerializer(
        instance={},
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


# Admin-only endpoints
class BroadcastMessageListCreateView(generics.ListCreateAPIView):
    """List and create broadcast messages (admin only)."""
    
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['target_audience', 'notif_type', 'is_active']
    ordering_fields = ['created_at', 'sent_at', 'reach_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return BroadcastMessage.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BroadcastMessageCreateSerializer
        return BroadcastMessageSerializer


class BroadcastMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete broadcast messages (admin only)."""
    
    serializer_class = BroadcastMessageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return BroadcastMessage.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def send_broadcast(request, pk):
    """Send a broadcast message to target audience."""
    
    broadcast = get_object_or_404(BroadcastMessage, id=pk)
    
    if broadcast.sent_at:
        return Response(
            {'error': 'This broadcast has already been sent.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    notifications = broadcast.send_broadcast()
    
    return Response({
        'message': f'Broadcast sent to {len(notifications)} users.',
        'reach_count': broadcast.reach_count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_notification(request):
    """Create a notification for a specific user (admin only)."""
    
    serializer = NotificationCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    notification = serializer.save()
    
    response_serializer = NotificationSerializer(notification)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)


# Notification preferences
class NotificationPreferenceDetailView(generics.RetrieveUpdateAPIView):
    """Get or update user notification preferences."""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        preference, created = NotificationPreference.objects.get_or_create(user=user)
        return preference


# Notification templates (admin only)
class NotificationTemplateListCreateView(generics.ListCreateAPIView):
    """List and create notification templates (admin only)."""
    
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template_type', 'notif_type', 'is_active']
    
    def get_queryset(self):
        return NotificationTemplate.objects.all()


class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete notification templates (admin only)."""
    
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return NotificationTemplate.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def preview_notification_template(request, pk):
    """Preview a notification template with sample context."""
    
    template = get_object_or_404(NotificationTemplate, id=pk)
    
    # Sample context for preview
    sample_context = {
        'user_name': 'John Doe',
        'amount': 'TSh 100',
        'goal_name': 'Emergency Fund',
        'date': '2024-06-01',
        'fund_name': 'Real Estate Fund',
    }
    
    rendered = template.render(sample_context)
    
    return Response({
        'template': NotificationTemplateSerializer(template).data,
        'preview': rendered
    }, status=status.HTTP_200_OK)


# Notification queue (admin only)
class NotificationQueueListView(generics.ListAPIView):
    """List queued notifications (admin only)."""
    
    serializer_class = NotificationQueueSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'notification_type', 'notif_type']
    ordering_fields = ['created_at', 'scheduled_at']
    ordering = ['scheduled_at', 'created_at']
    
    def get_queryset(self):
        return NotificationQueue.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def retry_failed_notifications(request):
    """Retry all failed notifications in the queue."""
    
    failed_queue = NotificationQueue.objects.filter(status='failed')
    retried_count = 0
    
    for queued_notif in failed_queue:
        if queued_notif.retry_count < 3:  # Max 3 retries
            queued_notif.status = 'pending'
            queued_notif.save()
            retried_count += 1
    
    return Response({
        'message': f'Retried {retried_count} failed notifications.',
        'retried_count': retried_count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def queue_notification(request):
    """Queue a notification for later sending (internal use)."""
    
    notification_type = request.data.get('notification_type')
    title = request.data.get('title')
    message = request.data.get('message')
    
    if not all([notification_type, title, message]):
        return Response(
            {'error': 'notification_type, title, and message are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create queued notification
    queued = NotificationQueue.objects.create(
        user=request.user,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=request.data.get('action_url', ''),
        action_text=request.data.get('action_text', ''),
        notif_type=request.data.get('notif_type', 'info'),
        scheduled_at=request.data.get('scheduled_at')
    )
    
    serializer = NotificationQueueSerializer(queued)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
