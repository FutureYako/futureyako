from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from common.models import BaseModel
from .managers import UserManager

AVATAR_COLORS = [
    ("#3B82F6", "Blue"),
    ("#8B5CF6", "Purple"),
    ("#EC4899", "Pink"),
    ("#EF4444", "Red"),
    ("#F59E0B", "Amber"),
    ("#10B981", "Emerald"),
    ("#06B6D4", "Cyan"),
    ("#6366F1", "Indigo"),
]

MEMBER_STATUS = [
    ("active", "Active"),
    ("suspended", "Suspended"),
    ("pending", "Pending"),
    ("deleted", "Deleted"),
]


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    avatar_color = models.CharField(max_length=10, default="#3B82F6")
    member_status = models.CharField(max_length=20, choices=MEMBER_STATUS, default="pending")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "phone_number"]

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def initials(self):
        parts = self.full_name.split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[-1][0]}".upper()
        return self.full_name[:2].upper()


class UserSettings(BaseModel):
    CURRENCY_CHOICES = [
        ("TZS", "TZS (TSh)"),
    ]
    LANGUAGE_CHOICES = [
        ("en-us", "English (US)"), ("en-gb", "English (UK)"),
        ("fr", "French"), ("es", "Spanish"), ("sw", "Swahili"), ("ar", "Arabic"),
    ]
    THEME_CHOICES = [("Light", "Light"), ("Dark", "Dark"), ("System", "System")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="settings")
    currency = models.CharField(max_length=5, choices=CURRENCY_CHOICES, default="TZS")
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="en-us")
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default="System")
    dashboard_show_stats = models.BooleanField(default=True)
    dashboard_show_activity = models.BooleanField(default=True)
    dashboard_show_goals = models.BooleanField(default=True)
    analytics_enabled = models.BooleanField(default=True)
    personalized_tips_enabled = models.BooleanField(default=True)
    marketing_enabled = models.BooleanField(default=False)

    class Meta:
        db_table = "user_settings"


class NotificationPreference(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_prefs")
    autosave_ok = models.BooleanField(default=True)
    autosave_fail = models.BooleanField(default=True)
    wallet_updates = models.BooleanField(default=True)
    goal_milestone = models.BooleanField(default=True)
    goal_deadline = models.BooleanField(default=True)
    weekly_report = models.BooleanField(default=False)
    newsletter = models.BooleanField(default=False)
    product_updates = models.BooleanField(default=True)

    class Meta:
        db_table = "notification_preferences"


class TwoFactorAuth(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="two_factor")
    is_enabled = models.BooleanField(default=False)
    secret_key = models.CharField(max_length=64, blank=True)
    backup_codes = models.JSONField(default=list)
    setup_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "two_factor_auth"


class LoginSession(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    session_key = models.CharField(max_length=128, unique=True)
    device_name = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    last_active = models.DateTimeField(auto_now=True)
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = "login_sessions"
        ordering = ["-last_active"]


class LoginHistory(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_history")
    device = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_successful = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=200, blank=True)
    login_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "login_history"
        ordering = ["-login_at"]


class OnboardingProgress(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="onboarding")
    funding_source_added = models.BooleanField(default=False)
    goals_created = models.BooleanField(default=False)
    autosave_configured = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "onboarding_progress"

    @property
    def current_step(self):
        if not self.funding_source_added:
            return "funding_source"
        if not self.goals_created:
            return "goals"
        if not self.autosave_configured:
            return "autosave"
        return "complete"
