from django.contrib.auth import get_user_model
from rest_framework import serializers
from apps.accounts.models import OnboardingProgress

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    wallet_number = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "full_name", "phone_number",
            "date_of_birth", "location", "bio",
            "avatar", "avatar_color", "member_status",
            "initials", "wallet_number", "created_at",
            "is_staff", "is_superuser",
        )
        read_only_fields = (
            "id", "email", "member_status", "created_at",
            "initials", "wallet_number", "is_staff", "is_superuser",
        )

    def get_wallet_number(self, obj):
        try:
            return obj.wallet.wallet_number
        except Exception:
            return None

    def get_initials(self, obj):
        return obj.initials


class AvatarUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("avatar",)

    def validate_avatar(self, value):
        max_size = 5 * 1024 * 1024  # 5 MB
        if value.size > max_size:
            raise serializers.ValidationError("Avatar file must be under 5 MB.")
        if not value.content_type.startswith("image/"):
            raise serializers.ValidationError("Only image files are accepted.")
        return value


class OnboardingSerializer(serializers.ModelSerializer):
    current_step = serializers.ReadOnlyField()

    class Meta:
        model = OnboardingProgress
        fields = (
            "funding_source_added", "goals_created",
            "autosave_configured", "completed", "completed_at", "current_step",
        )
        read_only_fields = ("completed_at", "current_step")
