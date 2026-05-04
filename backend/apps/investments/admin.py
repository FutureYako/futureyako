from django.contrib import admin
from .models import InvestmentFund, Investment, PortfolioSnapshot


@admin.register(InvestmentFund)
class InvestmentFundAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'annual_roi', 'min_investment',
        'risk_level', 'is_active', 'investor_count', 'created_at'
    ]
    list_filter = [
        'category', 'risk_level', 'is_active', 'created_at'
    ]
    search_fields = ['name', 'description']
    readonly_fields = [
        'id', 'projected_return_example', 'investor_count',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description')
        }),
        ('Financial Details', {
            'fields': ('annual_roi', 'min_investment', 'risk_level', 'duration')
        }),
        ('Content', {
            'fields': ('highlights', 'is_active')
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'user', 'fund', 'amount_invested',
        'current_value', 'roi_percentage', 'status', 'invested_at'
    ]
    list_filter = [
        'status', 'fund__category', 'fund__risk_level', 'invested_at'
    ]
    search_fields = [
        'reference_number', 'user__email', 'user__full_name', 'fund__name'
    ]
    readonly_fields = [
        'id', 'projected_return', 'projected_value', 'reference_number',
        'invested_at', 'days_invested', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Investment Details', {
            'fields': ('user', 'fund', 'funding_source', 'amount_invested')
        }),
        ('Financial Calculations', {
            'fields': (
                'projected_return', 'projected_value', 'current_value',
                'roi_percentage', 'days_invested'
            ),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'invested_at', 'matured_at', 'withdrawn_at')
        }),
        ('System Information', {
            'fields': ('id', 'reference_number', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def roi_percentage(self, obj):
        return f"{obj.roi_percentage:.2f}%"
    roi_percentage.short_description = 'ROI'


@admin.register(PortfolioSnapshot)
class PortfolioSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'total_value', 'change_percentage',
        'goals_value', 'investment_value', 'created_at'
    ]
    list_filter = ['change_percentage', 'created_at']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def has_add_permission(self, request):
        # Only allow creation through code, not admin interface
        return False
    
    def has_change_permission(self, request, obj=None):
        # Prevent manual editing of snapshots
        return False
