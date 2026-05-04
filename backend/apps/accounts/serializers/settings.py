from rest_framework import serializers
from apps.accounts.models import UserSettings, NotificationPreference


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = (
            "currency", "language", "theme",
            "dashboard_show_stats", "dashboard_show_activity", "dashboard_show_goals",
            "analytics_enabled", "personalized_tips_enabled", "marketing_enabled",
        )


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            "autosave_ok", "autosave_fail", "wallet_updates",
            "goal_milestone", "goal_deadline",
            "weekly_report", "newsletter", "product_updates",
        )
