from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserSettings, NotificationPreference, TwoFactorAuth, OnboardingProgress


@receiver(post_save, sender=User)
def create_user_related_records(sender, instance, created, **kwargs):
    if not created:
        return

    UserSettings.objects.get_or_create(user=instance)
    NotificationPreference.objects.get_or_create(user=instance)
    TwoFactorAuth.objects.get_or_create(user=instance)
    OnboardingProgress.objects.get_or_create(user=instance)

    # Wallet is created by the signup serializer so the wallet_number
    # can be returned in the response; we don't create it here.
