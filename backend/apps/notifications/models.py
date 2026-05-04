from datetime import timedelta
from django.db import models
from django.contrib.admin.models import LogEntry
from django.utils import timezone
from common.models import BaseModel


class Notification(BaseModel):
    """In-app notifications for users."""
    
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notif_type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='info'
    )
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=200, blank=True)
    action_text = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = "notifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notif_type']),
            models.Index(fields=['created_at']),
        ]
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.save()


class BroadcastMessage(BaseModel):
    """Broadcast messages sent to multiple users."""
    
    AUDIENCE_CHOICES = [
        ('all', 'All Users'),
        ('active_investors', 'Active Investors'),
        ('new_users', 'New Users'),
        ('failed_deductions', 'Users with Failed Deductions'),
    ]
    
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('announcement', 'Announcement'),
        ('maintenance', 'Maintenance'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField(max_length=2000)
    target_audience = models.CharField(
        max_length=30, 
        choices=AUDIENCE_CHOICES
    )
    notif_type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='info'
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    reach_count = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='broadcasts_created'
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "broadcast_messages"
        ordering = ['-created_at']
    
    def get_target_users(self):
        """Get queryset of target users based on audience."""
        from apps.accounts.models import User
        from apps.investments.models import Investment
        from apps.autosave.models import DeductionLog
        
        if self.target_audience == 'all':
            return User.objects.filter(member_status='active')
        
        elif self.target_audience == 'active_investors':
            return User.objects.filter(
                investments__status='active'
            ).distinct()
        
        elif self.target_audience == 'new_users':
            from django.utils import timezone
            thirty_days_ago = timezone.now() - timedelta(days=30)
            return User.objects.filter(
                created_at__gte=thirty_days_ago,
                member_status='active'
            )
        
        elif self.target_audience == 'failed_deductions':
            return User.objects.filter(
                deduction_logs__status='failed'
            ).distinct()
        
        return User.objects.none()
    
    def send_broadcast(self):
        """Send broadcast to target users."""
        from django.contrib import messages
        from django.core.mail import send_mail
        
        target_users = self.get_target_users()
        notifications_created = []
        
        for user in target_users:
            notification = Notification.objects.create(
                user=user,
                title=self.title,
                message=self.message,
                notif_type=self.notif_type,
                action_url=self.get_action_url_for_user(user)
            )
            notifications_created.append(notification)
        
        self.reach_count = len(notifications_created)
        self.save()
        
        return notifications_created
    
    def get_action_url_for_user(self, user):
        """Generate appropriate action URL based on message type and user."""
        if self.notif_type == 'maintenance':
            return '/settings'
        elif self.target_audience == 'failed_deductions':
            return '/autosave/preferences'
        elif self.target_audience == 'active_investors':
            return '/investments'
        return '/dashboard'


class NotificationPreference(BaseModel):
    """User notification preferences (different from accounts.NotificationPreference)."""
    
    user = models.OneToOneField(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='notification_settings'
    )
    
    # In-app notification preferences
    in_app_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=False)
    
    # Specific notification types
    autosave_notifications = models.BooleanField(default=True)
    goal_notifications = models.BooleanField(default=True)
    transaction_notifications = models.BooleanField(default=True)
    investment_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    class Meta:
        db_table = "notification_preferences_extended"
    
    def should_send_notification(self, notif_type: str) -> bool:
        """Check if notification should be sent based on preferences."""
        if not self.in_app_enabled:
            return False
        
        # Check quiet hours
        if self.quiet_hours_enabled:
            from django.utils import timezone
            now = timezone.now().time()
            if self.quiet_hours_start and self.quiet_hours_end:
                if self.quiet_hours_start <= now <= self.quiet_hours_end:
                    return False
        
        # Check notification type preferences
        type_mapping = {
            'autosave': self.autosave_notifications,
            'goal': self.goal_notifications,
            'transaction': self.transaction_notifications,
            'investment': self.investment_notifications,
            'system': self.system_notifications,
        }
        
        return type_mapping.get(notif_type, True)


class NotificationTemplate(BaseModel):
    """Reusable notification templates."""
    
    TEMPLATE_TYPES = [
        ('autosave_success', 'Auto-Save Success'),
        ('autosave_failed', 'Auto-Save Failed'),
        ('goal_milestone', 'Goal Milestone'),
        ('goal_deadline', 'Goal Deadline Reminder'),
        ('investment_matured', 'Investment Matured'),
        ('withdrawal_approved', 'Withdrawal Approved'),
        ('withdrawal_completed', 'Withdrawal Completed'),
        ('welcome', 'Welcome Message'),
    ]
    
    template_type = models.CharField(
        max_length=50, 
        choices=TEMPLATE_TYPES, 
        unique=True
    )
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    action_url = models.CharField(max_length=200, blank=True)
    action_text = models.CharField(max_length=50, blank=True)
    notif_type = models.CharField(
        max_length=20, 
        choices=Notification.TYPE_CHOICES, 
        default='info'
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "notification_templates"
    
    def render(self, context: dict) -> dict:
        """Render template with context variables."""
        try:
            title = self.title_template.format(**context)
            message = self.message_template.format(**context)
            action_url = self.action_url.format(**context) if self.action_url else ''
            action_text = self.action_text.format(**context) if self.action_text else ''
        except KeyError as e:
            # Fallback to template without variables if context is missing
            title = self.title_template
            message = self.message_template
            action_url = self.action_url
            action_text = self.action_text
        
        return {
            'title': title,
            'message': message,
            'action_url': action_url,
            'action_text': action_text,
            'notif_type': self.notif_type
        }


class NotificationQueue(BaseModel):
    """Queue for sending notifications asynchronously."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='queued_notifications'
    )
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_url = models.CharField(max_length=200, blank=True)
    action_text = models.CharField(max_length=50, blank=True)
    notif_type = models.CharField(
        max_length=20, 
        choices=Notification.TYPE_CHOICES, 
        default='info'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = "notification_queue"
        ordering = ['scheduled_at', 'created_at']
    
    def send(self):
        """Send the notification."""
        try:
            self.status = 'processing'
            self.save()
            
            # Check user preferences
            from apps.notifications.models import NotificationPreference
            try:
                prefs = self.user.notification_settings
                if not prefs.should_send_notification(self.notification_type):
                    self.status = 'sent'  # Mark as sent to avoid retry
                    self.save()
                    return True
            except NotificationPreference.DoesNotExist:
                # Create default preferences
                NotificationPreference.objects.create(user=self.user)
            
            # Create the notification
            notification = Notification.objects.create(
                user=self.user,
                title=self.title,
                message=self.message,
                notif_type=self.notif_type,
                action_url=self.action_url,
                action_text=self.action_text
            )
            
            self.status = 'sent'
            self.sent_at = timezone.now()
            self.save()
            
            return True
            
        except Exception as e:
            self.status = 'failed'
            self.error_message = str(e)
            self.retry_count += 1
            self.save()
            return False
