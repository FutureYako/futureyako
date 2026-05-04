from django.contrib import admin
from .models import Notification, BroadcastMessage, NotificationPreference, NotificationTemplate, NotificationQueue


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user', 'notif_type', 'is_read', 'created_at'
    ]
    list_filter = [
        'notif_type', 'is_read', 'created_at'
    ]
    search_fields = [
        'title', 'message', 'user__email', 'user__full_name'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('user', 'title', 'message', 'notif_type', 'is_read')
        }),
        ('Action', {
            'fields': ('action_url', 'action_text'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f"{updated} notifications marked as read.")
    mark_as_read.short_description = "Mark selected as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f"{updated} notifications marked as unread.")
    mark_as_unread.short_description = "Mark selected as unread"


@admin.register(BroadcastMessage)
class BroadcastMessageAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'target_audience', 'notif_type', 'reach_count',
        'sent_at', 'created_by', 'is_active'
    ]
    list_filter = [
        'target_audience', 'notif_type', 'is_active', 'sent_at', 'created_at'
    ]
    search_fields = [
        'title', 'message', 'created_by__email'
    ]
    readonly_fields = [
        'id', 'sent_at', 'reach_count', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Message Details', {
            'fields': (
                'title', 'message', 'target_audience', 'notif_type', 'is_active'
            )
        }),
        ('Metadata', {
            'fields': ('created_by', 'sent_at', 'reach_count')
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['send_broadcast']
    
    def send_broadcast(self, request, queryset):
        sent_count = 0
        for broadcast in queryset.filter(sent_at__isnull=True):
            broadcast.send_broadcast()
            sent_count += 1
        self.message_user(request, f"{sent_count} broadcasts sent.")
    send_broadcast.short_description = "Send selected broadcasts"


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'in_app_enabled', 'email_enabled',
        'autosave_notifications', 'quiet_hours_enabled'
    ]
    list_filter = [
        'in_app_enabled', 'email_enabled', 'autosave_notifications',
        'goal_notifications', 'transaction_notifications',
        'investment_notifications', 'quiet_hours_enabled'
    ]
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = [
        'id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('General Settings', {
            'fields': ('user', 'in_app_enabled', 'email_enabled')
        }),
        ('Notification Types', {
            'fields': (
                'autosave_notifications', 'goal_notifications',
                'transaction_notifications', 'investment_notifications',
                'system_notifications'
            )
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end')
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'template_type', 'title_template', 'notif_type', 'is_active', 'created_at'
    ]
    list_filter = [
        'template_type', 'notif_type', 'is_active', 'created_at'
    ]
    search_fields = [
        'template_type', 'title_template', 'message_template'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Template Details', {
            'fields': (
                'template_type', 'title_template', 'message_template',
                'notif_type', 'is_active'
            )
        }),
        ('Action', {
            'fields': ('action_url', 'action_text'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['preview_templates']
    
    def preview_templates(self, request, queryset):
        """Preview selected templates with sample data."""
        preview_data = []
        sample_context = {
            'user_name': 'John Doe',
            'amount': 'TSh 100',
            'goal_name': 'Emergency Fund',
            'date': '2024-06-01',
        }
        
        for template in queryset:
            rendered = template.render(sample_context)
            preview_data.append({
                'template_type': template.template_type,
                'preview': rendered
            })
        
        # For now, just show count (in production, you'd display actual previews)
        self.message_user(request, f"Generated previews for {len(preview_data)} templates.")
    preview_templates.short_description = "Preview selected templates"


@admin.register(NotificationQueue)
class NotificationQueueAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user', 'notification_type', 'status',
        'scheduled_at', 'retry_count', 'created_at'
    ]
    list_filter = [
        'status', 'notification_type', 'notif_type', 'created_at'
    ]
    search_fields = [
        'title', 'message', 'user__email', 'notification_type'
    ]
    readonly_fields = [
        'id', 'sent_at', 'error_message', 'retry_count',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Queue Details', {
            'fields': (
                'user', 'notification_type', 'title', 'message',
                'notif_type', 'status'
            )
        }),
        ('Scheduling', {
            'fields': ('scheduled_at', 'sent_at')
        }),
        ('Error Handling', {
            'fields': ('error_message', 'retry_count'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['retry_selected', 'force_send']
    
    def retry_selected(self, request, queryset):
        """Retry selected failed notifications."""
        retried = 0
        for queued in queryset.filter(status='failed', retry_count__lt=3):
            queued.status = 'pending'
            queued.save()
            retried += 1
        self.message_user(request, f"Queued {retried} notifications for retry.")
    retry_selected.short_description = "Retry selected failed notifications"
    
    def force_send(self, request, queryset):
        """Force send selected notifications."""
        sent = 0
        for queued in queryset.filter(status='pending'):
            if queued.send():
                sent += 1
        self.message_user(request, f"Force sent {sent} notifications.")
    force_send.short_description = "Force send selected notifications"
