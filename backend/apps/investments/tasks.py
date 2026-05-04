from celery import shared_task
from django.utils import timezone
from .models import Investment, InvestmentFund, PortfolioSnapshot
from apps.accounts.models import User


@shared_task
def update_current_values():
    """Update current values for investments (mock implementation)."""
    
    investments = Investment.objects.filter(status='active')
    updated_count = 0
    
    for investment in investments:
        # Mock investment growth - in production, this would integrate
        # with actual investment fund performance data
        days_held = (timezone.now() - investment.invested_at).days
        
        # Simple growth calculation (e.g., 0.1% per day for demo)
        if days_held > 0:
            growth_rate = investment.fund.annual_roi / 365 / 100
            growth_multiplier = 1 + (growth_rate * days_held)
            
            # Add some randomness to simulate market fluctuations
            import random
            fluctuation = random.uniform(0.95, 1.05)
            
            investment.current_value = investment.amount_invested * growth_multiplier * fluctuation
            investment.save()
            updated_count += 1
    
    # Create portfolio snapshots for all users
    snapshot_count = 0
    for user in User.objects.filter(member_status='active'):
        try:
            PortfolioSnapshot.create_snapshot(user)
            snapshot_count += 1
        except Exception:
            pass  # Skip users without portfolios
    
    return {
        'investments_updated': updated_count,
        'snapshots_created': snapshot_count,
        'message': f'Updated {updated_count} investments and created {snapshot_count} portfolio snapshots.'
    }


@shared_task
def check_matured_investments():
    """Check and mark matured investments."""
    
    matured_count = 0
    
    for investment in Investment.objects.filter(status='active'):
        if investment.is_matured:
            investment.status = 'matured'
            investment.matured_at = timezone.now()
            investment.save()
            matured_count += 1
            
            # Send notification to user
            from apps.notifications.tasks import send_investment_matured_notification
            send_investment_matured_notification.delay(investment.id)
    
    return {
        'matured': matured_count,
        'message': f'Marked {matured_count} investments as matured.'
    }


@shared_task
def send_investment_matured_notification(investment_id):
    """Send notification when investment matures."""
    
    try:
        investment = Investment.objects.get(id=investment_id)
        
        title = f"Investment Matured: {investment.fund.name}"
        message = f"Your investment in {investment.fund.name} has matured. Current value: TSh {investment.current_value:,.2f}. You can now withdraw or reinvest."
        
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=investment.user,
            title=title,
            message=message,
            notif_type='success',
            action_url='/investments',
            action_text='View Investment'
        )
        
    except Investment.DoesNotExist:
        pass
