from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # User notifications
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<uuid:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('<uuid:pk>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('read-all/', views.mark_all_notifications_read, name='mark-all-read'),
    path('<uuid:pk>/delete/', views.delete_notification, name='delete-notification'),
    path('stats/', views.notification_stats, name='notification-stats'),
    
    # Notification preferences
    path('preferences/', views.NotificationPreferenceDetailView.as_view(), name='notification-preferences'),
    
    # Queue notifications (internal use)
    path('queue/', views.queue_notification, name='queue-notification'),
    
    # Admin-only endpoints
    path('admin/broadcasts/', views.BroadcastMessageListCreateView.as_view(), name='broadcast-list'),
    path('admin/broadcasts/<uuid:pk>/', views.BroadcastMessageDetailView.as_view(), name='broadcast-detail'),
    path('admin/broadcasts/<uuid:pk>/send/', views.send_broadcast, name='send-broadcast'),
    path('admin/create/', views.create_notification, name='create-notification'),
    
    # Notification templates (admin)
    path('admin/templates/', views.NotificationTemplateListCreateView.as_view(), name='template-list'),
    path('admin/templates/<uuid:pk>/', views.NotificationTemplateDetailView.as_view(), name='template-detail'),
    path('admin/templates/<uuid:pk>/preview/', views.preview_notification_template, name='preview-template'),
    
    # Notification queue (admin)
    path('admin/queue/', views.NotificationQueueListView.as_view(), name='queue-list'),
    path('admin/queue/retry/', views.retry_failed_notifications, name='retry-failed'),
]
