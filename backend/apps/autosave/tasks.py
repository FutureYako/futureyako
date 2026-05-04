from celery import shared_task
from django.utils import timezone
from .models import SavingPreference, DeductionLog
from apps.transactions.models import Transaction
from apps.goals.models import Goal, GroupParticipant
from common.utils import apply_platform_fee
from apps.admin_panel.models import PlatformSettings


@shared_task(bind=True, max_retries=3)
def run_scheduled_deductions(self):
    """Run all scheduled auto-save deductions."""
    
    prefs = SavingPreference.objects.filter(
        is_enabled=True,
        next_deduction_at__lte=timezone.now(),
        commitment_end_at__gt=timezone.now(),
    )
    
    processed_count = 0
    failed_count = 0
    
    for pref in prefs:
        try:
            process_deduction.delay(pref.id)
            processed_count += 1
        except Exception as e:
            failed_count += 1
    
    return {
        'processed': processed_count,
        'failed': failed_count,
        'message': f'Processed {processed_count} deductions, {failed_count} failed.'
    }


@shared_task(bind=True, max_retries=3)
def process_deduction(self, pref_id):
    """Process a single auto-save deduction."""
    
    try:
        pref = SavingPreference.objects.get(id=pref_id)
        
        # Get primary funding source or use first available
        funding_source = pref.funding_sources.filter(
            status='active'
        ).first()
        
        if not funding_source:
            raise Exception("No active funding source available")
        
        # Calculate deduction amount
        if pref.amount_type == 'Percentage':
            # For percentage, use a default income calculation
            # In production, this would integrate with payroll/income data
            amount = pref.amount  # Simplified for demo
        else:
            amount = pref.amount
        
        # Create deduction log
        log = DeductionLog.objects.create(
            user=pref.user,
            preference=pref,
            scheduled_at=pref.next_deduction_at,
            amount=amount,
            funding_source=funding_source,
            status='pending'
        )
        
        # Process payment (mock - integrate with payment gateway)
        try:
            # charge_funding_source(funding_source, amount)
            pass  # Placeholder for actual payment processing
            
            # Mark log as completed
            log.mark_completed()
            
            # Distribute to goals
            distribute_to_goals(pref.user, amount)
            
            # Create transaction record
            settings = PlatformSettings.get_solo()
            fee, net_amount = apply_platform_fee(amount, settings.platform_fee_percentage)
            
            Transaction.objects.create(
                user=pref.user,
                transaction_type='Auto-Save',
                category='Savings',
                amount=amount,
                description='Automated savings deduction',
                funding_source=funding_source,
                platform_fee=fee,
                net_amount=net_amount,
                status='completed',
                completed_at=timezone.now()
            )
            
            # Advance next deduction date
            pref.advance_next_deduction()
            
            # Send notification (async)
            from apps.notifications.tasks import send_autosave_notification
            send_autosave_notification.delay(log.id)
            
        except Exception as payment_error:
            log.mark_failed(str(payment_error))
            raise payment_error
            
    except SavingPreference.DoesNotExist:
        raise Exception(f"SavingPreference {pref_id} not found")
    except Exception as e:
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        raise e


def distribute_to_goals(user, total_amount):
    """Distribute auto-save amount across user's active savings goals using GoalWeight."""

    goals = Goal.objects.filter(user=user, status='active', type='savings')

    if not goals.exists():
        return 0

    # Load goal weights for active goals
    from .models import GoalWeight
    weights = {
        gw.goal_id: gw
        for gw in GoalWeight.objects.filter(user=user, is_active=True, goal__in=goals)
    }

    total_weight = sum(gw.weight_value for gw in weights.values())

    count = goals.count()
    for goal in goals:
        gw = weights.get(goal.id)
        if total_weight > 0 and gw:
            allocated = (gw.weight_value / total_weight) * total_amount
        else:
            allocated = total_amount / count

        goal.current += allocated
        if goal.current >= goal.target:
            goal.status = 'completed'
        goal.save()

    return count
