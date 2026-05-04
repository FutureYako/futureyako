from django.db import models
from django.contrib.auth import get_user_model
from apps.accounts.models import User


class Webhook(models.Model):
    """Webhook configuration for external integrations."""
    
    EVENT_TYPES = [
        ("transaction.created", "Transaction Created"),
        ("transaction.completed", "Transaction Completed"),
        ("wallet.deposit", "Wallet Deposit"),
        ("wallet.withdrawal", "Wallet Withdrawal"),
        ("goal.created", "Goal Created"),
        ("goal.updated", "Goal Updated"),
        ("goal.completed", "Goal Completed"),
        ("investment.created", "Investment Created"),
        ("investment.matured", "Investment Matured"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="webhooks")
    name = models.CharField(max_length=255)
    url = models.URLField(max_length=500)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    secret = models.CharField(max_length=255, blank=True, help_text="Secret for webhook signature verification")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ["user", "name", "event_type"]
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.name} - {self.event_type}"


class WebhookLog(models.Model):
    """Log of webhook delivery attempts."""
    
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("retrying", "Retrying"),
    ]
    
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name="logs")
    event_type = models.CharField(max_length=50)
    payload = models.JSONField()
    response_status = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    retry_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.webhook.name} - {self.event_type} - {self.status}"
