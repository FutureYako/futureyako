from django.contrib import admin
from .models import Goal, GroupParticipant, WithdrawalRequest, WithdrawalVote


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'user', 'type', 'target', 
        'current', 'progress_percentage', 'status', 'created_at'
    ]
    list_filter = [
        'type', 'status', 'created_at', 'deadline'
    ]
    search_fields = [
        'name', 'user__email', 'user__full_name'
    ]
    readonly_fields = [
        'id', 'code', 'progress_percentage', 
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'type', 'name', 'description')
        }),
        ('Financial Details', {
            'fields': ('target', 'current', 'status')
        }),
        ('Savings Goal Settings', {
            'fields': ('deadline', 'locked', 'weight'),
            'classes': ('collapse',)
        }),
        ('Group Goal Settings', {
            'fields': (
                'groupSubType', 'visibility', 'contributionModel',
                'withdrawalControl', 'code'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def progress_percentage(self, obj):
        return f"{obj.progress_percentage:.1f}%"
    progress_percentage.short_description = 'Progress'


@admin.register(GroupParticipant)
class GroupParticipantAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'goal', 'amount_contributed', 
        'share_target', 'is_creator', 'joined_at'
    ]
    list_filter = [
        'is_creator', 'joined_at', 'goal__type'
    ]
    search_fields = [
        'user__email', 'user__full_name', 'goal__name'
    ]
    readonly_fields = ['id', 'joined_at', 'created_at', 'updated_at']
    
    def share_target(self, obj):
        return f"TSh {obj.share_target:,.2f}"
    share_target.short_description = 'Share Target'


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = [
        'goal', 'requested_by', 'amount', 'status',
        'approval_count', 'rejection_count', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'goal__groupSubType'
    ]
    search_fields = [
        'goal__name', 'requested_by__email', 'justification'
    ]
    readonly_fields = [
        'id', 'approval_count', 'rejection_count', 
        'resolved_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Request Details', {
            'fields': ('goal', 'requested_by', 'amount', 'justification')
        }),
        ('Status', {
            'fields': ('status', 'resolved_at')
        }),
        ('Voting Summary', {
            'fields': ('approval_count', 'rejection_count'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(WithdrawalVote)
class WithdrawalVoteAdmin(admin.ModelAdmin):
    list_display = [
        'withdrawal_req', 'participant', 'vote', 'voted_at'
    ]
    list_filter = [
        'vote', 'voted_at', 'withdrawal_req__status'
    ]
    search_fields = [
        'participant__email', 'withdrawal_req__goal__name'
    ]
    readonly_fields = ['id', 'voted_at', 'created_at']
