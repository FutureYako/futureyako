from celery import shared_task
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from .models import Notification, NotificationTemplate, NotificationQueue
from apps.goals.models import Goal
from apps.autosave.models import DeductionLog


@shared_task
def send_autosave_notification(deduction_log_id):
    """Send auto-save success/failure notification."""
    
    try:
        log = DeductionLog.objects.get(id=deduction_log_id)
        
        if log.status == 'completed':
            template_type = 'autosave_success'
            context = {
                'amount': f"TSh {log.amount:,.2f}",
                'funding_source': log.funding_source.name,
                'date': log.executed_at.strftime('%Y-%m-%d %H:%M')
            }
        elif log.status == 'failed':
            template_type = 'autosave_failed'
            context = {
                'amount': f"TSh {log.amount:,.2f}",
                'funding_source': log.funding_source.name,
                'reason': log.failure_reason,
                'date': log.failed_at.strftime('%Y-%m-%d %H:%M')
            }
        else:
            return  # Skip pending notifications
        
        # Get template
        try:
            template = NotificationTemplate.objects.get(
                template_type=template_type,
                is_active=True
            )
            rendered = template.render(context)
            
            # Create notification
            Notification.objects.create(
                user=log.user,
                **rendered
            )
            
        except NotificationTemplate.DoesNotExist:
            # Fallback notification
            title = "Auto-Save " + ("Completed" if log.status == 'completed' else "Failed")
            message = f"Your auto-save of TSh {log.amount:,.2f} has been {'processed successfully' if log.status == 'completed' else 'failed'}."
            
            Notification.objects.create(
                user=log.user,
                title=title,
                message=message,
                notif_type='success' if log.status == 'completed' else 'warning'
            )
            
    except DeductionLog.DoesNotExist:
        pass


@shared_task
def send_goal_deadline_reminders():
    """Send goal deadline reminders (30 days and 7 days before)."""
    
    today = timezone.now().date()
    
    # Goals with deadlines in 30 days
    deadline_30 = today + timedelta(days=30)
    goals_30 = Goal.objects.filter(
        deadline=deadline_30,
        type='savings',
        status='active'
    )

    # Goals with deadlines in 7 days
    deadline_7 = today + timedelta(days=7)
    goals_7 = Goal.objects.filter(
        deadline=deadline_7,
        type='savings',
        status='active'
    )
    
    sent_count = 0
    
    for goal in list(goals_30) + list(goals_7):
        days_remaining = (goal.deadline - today).days
        
        try:
            template = NotificationTemplate.objects.get(
                template_type='goal_deadline',
                is_active=True
            )
            
            context = {
                'goal_name': goal.name,
                'days_remaining': days_remaining,
                'current_amount': f"TSh {goal.current:,.2f}",
                'target_amount': f"TSh {goal.target:,.2f}",
                'remaining_amount': f"TSh {goal.remaining_amount:,.2f}",
                'deadline': goal.deadline.strftime('%Y-%m-%d')
            }
            
            rendered = template.render(context)
            
            Notification.objects.create(
                user=goal.user,
                **rendered
            )
            
            sent_count += 1
            
        except NotificationTemplate.DoesNotExist:
            # Fallback notification
            title = f"Goal Deadline Reminder: {goal.name}"
            message = f"Your goal '{goal.name}' deadline is in {days_remaining} days. You've saved TSh {goal.current:,.0f} of TSh {goal.target:,.0f}."
            
            Notification.objects.create(
                user=goal.user,
                title=title,
                message=message,
                notif_type='warning'
            )
            
            sent_count += 1
    
    return {
        'sent': sent_count,
        'message': f'Sent {sent_count} goal deadline reminders.'
    }


@shared_task
def send_weekly_reports():
    """Send weekly savings reports to users who opted in."""
    
    from apps.accounts.models import NotificationPreference
    
    # Get users who want weekly reports
    users = NotificationPreference.objects.filter(
        weekly_report=True,
        user__member_status='active'
    ).select_related('user')
    
    sent_count = 0
    
    for pref in users:
        user = pref.user
        
        # Calculate weekly stats
        week_start = timezone.now() - timedelta(days=7)

        from apps.transactions.models import Transaction
        weekly_txns = Transaction.objects.filter(
            user=user,
            transaction_type='Auto-Save',
            status='completed',
            created_at__gte=week_start
        )

        weekly_saved = weekly_txns.aggregate(
            total=Sum('net_amount')
        )['total'] or 0
        
        if weekly_saved > 0:
            title = "Weekly Savings Report"
            message = f"This week you saved TSh {weekly_saved:,.0f} through auto-save. Keep up the great work!"
            
            Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notif_type='info'
            )
            
            sent_count += 1
    
    return {
        'sent': sent_count,
        'message': f'Sent {sent_count} weekly reports.'
    }


@shared_task
def process_notification_queue():
    """Process pending notifications in the queue."""
    
    pending = NotificationQueue.objects.filter(
        status='pending',
        scheduled_at__lte=timezone.now()
    )
    
    processed_count = 0
    failed_count = 0
    
    for queued in pending:
        try:
            if queued.send():
                processed_count += 1
            else:
                failed_count += 1
        except Exception:
            failed_count += 1
    
    return {
        'processed': processed_count,
        'failed': failed_count,
        'message': f'Processed {processed_count} notifications, {failed_count} failed.'
    }
