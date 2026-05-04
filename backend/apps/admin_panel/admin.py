from django.contrib import admin
from .models import (
    PlatformSettings, SystemAlert, AdminActivityLog, 
    MonthlyStats, SystemHealth
)


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    """Admin interface for platform settings (singleton)."""
    
    list_display = [
        'platform_fee_percentage', 'maintenance_mode_enabled',
        'bank_linking_enabled', 'mobile_money_enabled'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Financial Settings', {
            'fields': (
                'min_saving_duration_months', 'max_goals_per_user',
                'platform_fee_percentage', 'max_withdrawal_per_day',
                'max_investment_per_user'
            )
        }),
        ('Feature Toggles', {
            'fields': (
                'maintenance_mode_enabled', 'bank_linking_enabled',
                'mobile_money_enabled', 'investments_enabled',
                'group_goals_enabled'
            )
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not PlatformSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of the singleton
        return False


@admin.register(SystemAlert)
class SystemAlertAdmin(admin.ModelAdmin):
    """Admin interface for system alerts."""
    
    list_display = [
        'title', 'level', 'is_active', 'auto_dismiss_at',
        'dismissed_by', 'created_at'
    ]
    list_filter = [
        'level', 'is_active', 'created_at', 'dismissed_at'
    ]
    search_fields = ['title', 'message']
    readonly_fields = [
        'id', 'dismissed_at', 'dismissed_by', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Alert Details', {
            'fields': ('title', 'message', 'level', 'is_active')
        }),
        ('Auto-dismiss', {
            'fields': ('auto_dismiss_at',),
            'classes': ('collapse',)
        }),
        ('Dismissal Information', {
            'fields': ('dismissed_at', 'dismissed_by'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['dismiss_alerts']
    
    def dismiss_alerts(self, request, queryset):
        """Dismiss selected alerts."""
        count = 0
        for alert in queryset.filter(is_active=True):
            alert.dismiss(request.user)
            count += 1
        self.message_user(request, f"Dismissed {count} alerts.")
    dismiss_alerts.short_description = "Dismiss selected alerts"


@admin.register(AdminActivityLog)
class AdminActivityLogAdmin(admin.ModelAdmin):
    """Admin interface for activity logs."""
    
    list_display = [
        'admin_user', 'action', 'target_user', 'target_object_type',
        'ip_address', 'created_at'
    ]
    list_filter = [
        'action', 'admin_user', 'target_object_type', 'created_at'
    ]
    search_fields = [
        'admin_user__email', 'target_user__email',
        'target_object_id', 'details'
    ]
    readonly_fields = [
        'id', 'admin_user', 'action', 'target_user',
        'target_object_id', 'target_object_type', 'details',
        'ip_address', 'user_agent', 'created_at'
    ]
    
    fieldsets = (
        ('Action Details', {
            'fields': (
                'admin_user', 'action', 'target_user',
                'target_object_id', 'target_object_type'
            )
        }),
        ('Additional Information', {
            'fields': ('details', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # Activity logs are created automatically
        return False
    
    def has_change_permission(self, request, obj=None):
        # Prevent manual editing of activity logs
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete activity logs
        return request.user.is_superuser


@admin.register(MonthlyStats)
class MonthlyStatsAdmin(admin.ModelAdmin):
    """Admin interface for monthly statistics."""
    
    list_display = [
        'year', 'month', 'total_users', 'active_users',
        'new_users', 'total_savings', 'platform_revenue'
    ]
    list_filter = ['year', 'month']
    ordering = ['-year', '-month']
    readonly_fields = [
        'id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Period', {
            'fields': ('year', 'month')
        }),
        ('User Statistics', {
            'fields': ('total_users', 'active_users', 'new_users')
        }),
        ('Financial Statistics', {
            'fields': (
                'total_savings', 'total_invested', 'platform_revenue'
            )
        }),
        ('Transaction Statistics', {
            'fields': (
                'total_transactions', 'successful_transactions',
                'failed_transactions'
            )
        }),
        ('Goal Statistics', {
            'fields': ('active_goals', 'completed_goals')
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['generate_current_month']
    
    def generate_current_month(self, request, queryset):
        """Generate statistics for current month."""
        stats = MonthlyStats.generate_current_month_stats()
        self.message_user(
            request, 
            f"Generated statistics for {stats.year}-{stats.month:02d}"
        )
    generate_current_month.short_description = "Generate current month stats"


@admin.register(SystemHealth)
class SystemHealthAdmin(admin.ModelAdmin):
    """Admin interface for system health monitoring."""
    
    list_display = [
        'service_name', 'status', 'response_time_ms',
        'error_rate', 'last_check'
    ]
    list_filter = ['status', 'last_check']
    ordering = ['service_name']
    readonly_fields = [
        'id', 'last_check', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Service Information', {
            'fields': ('service_name', 'status')
        }),
        ('Performance Metrics', {
            'fields': ('response_time_ms', 'error_rate')
        }),
        ('Additional Details', {
            'fields': ('details',),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'last_check', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['check_all_services', 'mark_all_healthy']
    
    def check_all_services(self, request, queryset):
        """Trigger health check for all services."""
        # This would typically call actual health check endpoints
        count = 0
        for health in queryset:
            # Simulate health check - in production, call actual service
            health.last_check = timezone.now()
            health.save()
            count += 1
        self.message_user(request, f"Checked {count} services.")
    check_all_services.short_description = "Check all services"
    
    def mark_all_healthy(self, request, queryset):
        """Mark all selected services as healthy."""
        count = queryset.update(status='healthy')
        self.message_user(request, f"Marked {count} services as healthy.")
    mark_all_healthy.short_description = "Mark selected as healthy"
