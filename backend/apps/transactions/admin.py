from django.contrib import admin
from .models import Transaction, WithdrawalRequest, TransactionExport


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'user', 'transaction_type', 'category',
        'amount', 'net_amount', 'status', 'created_at'
    ]
    list_filter = [
        'transaction_type', 'category', 'status', 'created_at'
    ]
    search_fields = [
        'reference_number', 'user__email', 'user__full_name', 'description'
    ]
    readonly_fields = [
        'id', 'reference_number', 'platform_fee', 'net_amount',
        'effective_amount', 'is_credit', 'is_debit',
        'processed_at', 'completed_at', 'failed_at',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Transaction Details', {
            'fields': (
                'user', 'transaction_type', 'category', 'amount',
                'description', 'status'
            )
        }),
        ('Financial Calculations', {
            'fields': (
                'platform_fee', 'net_amount', 'effective_amount',
                'is_credit', 'is_debit'
            ),
            'classes': ('collapse',)
        }),
        ('Relationships', {
            'fields': (
                'funding_source', 'destination_goal', 'destination_fund'
            ),
            'classes': ('collapse',)
        }),
        ('Processing Information', {
            'fields': (
                'processed_at', 'completed_at', 'failed_at',
                'failure_reason'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'reference_number', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # Allow creation through admin interface for testing
        return request.user.is_superuser
    
    def effective_amount(self, obj):
        return f"TSh {obj.effective_amount:,.2f}"
    effective_amount.short_description = 'Effective Amount'


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'amount', 'withdrawal_method', 'destination_source',
        'status', 'approved_by', 'created_at'
    ]
    list_filter = [
        'status', 'withdrawal_method', 'created_at', 'approved_at'
    ]
    search_fields = [
        'user__email', 'user__full_name', 'destination_source__name'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Request Details', {
            'fields': (
                'user', 'amount', 'withdrawal_method', 
                'destination_source', 'status'
            )
        }),
        ('Admin Actions', {
            'fields': (
                'admin_notes', 'approved_by', 'approved_at',
                'rejection_reason', 'completed_at'
            )
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        """Approve selected withdrawal requests."""
        count = 0
        for withdrawal in queryset.filter(status='pending'):
            withdrawal.approve(request.user)
            count += 1
        self.message_user(request, f"{count} withdrawal requests approved.")
    approve_requests.short_description = "Approve selected requests"
    
    def reject_requests(self, request, queryset):
        """Reject selected withdrawal requests."""
        count = 0
        for withdrawal in queryset.filter(status='pending'):
            withdrawal.reject(request.user, "Rejected by admin")
            count += 1
        self.message_user(request, f"{count} withdrawal requests rejected.")
    reject_requests.short_description = "Reject selected requests"


@admin.register(TransactionExport)
class TransactionExportAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'format', 'date_from', 'date_to',
        'status', 'record_count', 'created_at'
    ]
    list_filter = [
        'format', 'status', 'created_at'
    ]
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = [
        'id', 'file_path', 'record_count', 'error_message',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Export Details', {
            'fields': ('user', 'format', 'date_from', 'date_to', 'status')
        }),
        ('Results', {
            'fields': ('file_path', 'record_count', 'error_message'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # Users create exports through API, not admin
        return False
    
    def has_change_permission(self, request, obj=None):
        # Prevent manual editing of exports
        return False
