import hmac
import hashlib
import json
import requests
from celery import shared_task
from django.conf import settings
from .models import Webhook, WebhookLog


@shared_task
def trigger_webhook(webhook_id, event_type, payload):
    """Trigger a webhook delivery."""
    try:
        webhook = Webhook.objects.get(id=webhook_id, is_active=True)
    except Webhook.DoesNotExist:
        return
    
    # Create log entry
    log = WebhookLog.objects.create(
        webhook=webhook,
        event_type=event_type,
        payload=payload,
        status="pending"
    )
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event_type,
        "X-Webhook-Timestamp": str(int(__import__('time').time())),
    }
    
    # Add signature if secret is configured
    if webhook.secret:
        signature = generate_signature(payload, webhook.secret)
        headers["X-Webhook-Signature"] = signature
    
    # Send webhook
    try:
        response = requests.post(
            webhook.url,
            json=payload,
            headers=headers,
            timeout=10
        )
        
        log.response_status = response.status_code
        log.response_body = response.text[:1000]  # Limit response body size
        
        if response.status_code >= 200 and response.status_code < 300:
            log.status = "success"
        else:
            log.status = "failed"
            log.retry_count += 1
            # Retry logic could be added here
            
    except requests.RequestException as e:
        log.status = "failed"
        log.response_body = str(e)[:1000]
        log.retry_count += 1
    
    log.save()


def generate_signature(payload, secret):
    """Generate HMAC signature for webhook."""
    payload_str = json.dumps(payload, sort_keys=True)
    signature = hmac.new(
        secret.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


@shared_task
def broadcast_webhook_event(event_type, payload, user_id=None):
    """Broadcast event to all matching webhooks."""
    queryset = Webhook.objects.filter(
        event_type=event_type,
        is_active=True
    )
    
    if user_id:
        queryset = queryset.filter(user_id=user_id)
    
    for webhook in queryset:
        trigger_webhook.delay(webhook.id, event_type, payload)
