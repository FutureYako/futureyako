from django.contrib import admin
from .models import SavingPreference, DeductionLog, GoalWeight, OnboardingProgress


@admin.register(SavingPreference)
class SavingPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'amount', 'amount_type', 'frequency', 
        'duration_months', 'is_enabled', 'is_active', 'next_deduction_at'
    ]
    list_filter = [
        'amount_type', 'frequency', 'is_enabled', 'created_at'
    ]
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = [
        'id', 'next_deduction_at', 'commitment_end_at', 'is_active',
        'days_until_next_deduction', 'days_remaining', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Settings', {
            'fields': ('user', 'amount', 'amount_type', 'frequency', 'duration_months')
        }),
        ('Funding', {
            'fields': ('funding_sources', 'is_enabled')
        }),
        ('Schedule', {
            'fields': ('next_deduction_at', 'commitment_end_at')
        }),
        ('Status Information', {
            'fields': ('is_active', 'days_until_next_deduction', 'days_remaining'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(DeductionLog)
class DeductionLogAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'amount', 'funding_source', 'status',
        'scheduled_at', 'executed_at', 'retry_count'
    ]
    list_filter = [
        'status', 'funding_source', 'created_at', 'scheduled_at'
    ]
    search_fields = [
        'user__email', 'user__full_name', 'funding_source__name'
    ]
    readonly_fields = [
        'id', 'can_retry', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Deduction Details', {
            'fields': ('user', 'preference', 'amount', 'funding_source')
        }),
        ('Timing', {
            'fields': ('scheduled_at', 'executed_at')
        }),
        ('Status', {
            'fields': ('status', 'failure_reason', 'retry_count', 'next_retry_at')
        }),
        ('System Information', {
            'fields': ('id', 'can_retry', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(GoalWeight)
class GoalWeightAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'goal', 'weight_type', 'weight_value',
        'effective_weight', 'is_active', 'created_at'
    ]
    list_filter = [
        'weight_type', 'is_active', 'created_at'
    ]
    search_fields = [
        'user__email', 'user__full_name', 'goal__name'
    ]
    readonly_fields = [
        'id', 'effective_weight', 'created_at', 'updated_at'
    ]


@admin.register(OnboardingProgress)
class OnboardingProgressAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'funding_source_added', 'goals_created',
        'autosave_configured', 'completed', 'completion_percentage'
    ]
    list_filter = [
        'completed', 'funding_source_added', 'goals_created',
        'autosave_configured', 'created_at'
    ]
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = [
        'id', 'completion_percentage', 'completed_at', 'created_at', 'updated_at'
    ]
    
    def completion_percentage(self, obj):
        return f"{obj.completion_percentage}%"
    completion_percentage.short_description = 'Progress'
