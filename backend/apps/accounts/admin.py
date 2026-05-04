from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, UserSettings, NotificationPreference,
    TwoFactorAuth, LoginSession, LoginHistory, OnboardingProgress,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "phone_number", "member_status", "is_staff", "created_at")
    list_filter = ("member_status", "is_staff", "is_superuser")
    search_fields = ("email", "full_name", "phone_number")
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("full_name", "phone_number", "date_of_birth", "location", "bio", "avatar_color")}),
        ("Status", {"fields": ("member_status", "is_active", "is_staff", "is_superuser")}),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "phone_number", "password1", "password2"),
        }),
    )


admin.site.register(UserSettings)
admin.site.register(NotificationPreference)
admin.site.register(TwoFactorAuth)
admin.site.register(LoginSession)
admin.site.register(LoginHistory)
admin.site.register(OnboardingProgress)
