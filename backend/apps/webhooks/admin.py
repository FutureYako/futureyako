from django.contrib import admin
from .models import Webhook, WebhookLog


@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'event_type', 'url', 'is_active', 'created_at']
    list_filter = ['event_type', 'is_active', 'created_at']
    search_fields = ['name', 'url', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Webhook Configuration', {
            'fields': ('user', 'name', 'url', 'event_type', 'secret', 'is_active')
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ['webhook', 'event_type', 'status', 'response_status', 'retry_count', 'created_at']
    list_filter = ['status', 'event_type', 'created_at']
    search_fields = ['webhook__name', 'event_type']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Log Details', {
            'fields': ('webhook', 'event_type', 'payload', 'status', 'retry_count')
        }),
        ('Response', {
            'fields': ('response_status', 'response_body'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
