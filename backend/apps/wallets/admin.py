from django.contrib import admin
from .models import Wallet, FundingSource


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['wallet_number', 'user', 'status', 'total_balance', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['wallet_number', 'user__email']
    readonly_fields = ['id', 'wallet_number', 'created_at', 'updated_at']
    
    def total_balance(self, obj):
        return f"TSh {obj.total_balance:,.2f}"
    total_balance.short_description = 'Total Balance'


@admin.register(FundingSource)
class FundingSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'source_type', 'wallet', 'is_primary', 'status', 'created_at']
    list_filter = ['source_type', 'status', 'is_primary', 'created_at']
    search_fields = ['name', 'account_holder_name', 'wallet__wallet_number']
    readonly_fields = ['id', 'masked_identifier', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('wallet', 'source_type', 'name', 'account_holder_name')
        }),
        ('Status', {
            'fields': ('is_primary', 'status', 'verified_at')
        }),
        ('System Information', {
            'fields': ('id', 'masked_identifier', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
