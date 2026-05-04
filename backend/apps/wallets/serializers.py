from rest_framework import serializers
from .models import Wallet, FundingSource


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for wallet data."""
    
    total_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    available_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = Wallet
        fields = [
            'id', 'wallet_number', 'status', 
            'total_balance', 'available_balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'wallet_number', 'created_at', 'updated_at']


class FundingSourceSerializer(serializers.ModelSerializer):
    """Serializer for funding source data."""
    
    masked_identifier = serializers.ReadOnlyField()
    
    class Meta:
        model = FundingSource
        fields = [
            'id', 'source_type', 'name', 'masked_identifier',
            'account_holder_name', 'is_primary', 'status',
            'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'masked_identifier', 'verified_at', 
            'created_at', 'updated_at'
        ]
    
    def validate_account_identifier(self, value):
        """Validate account identifier format."""
        if self.initial_data.get('source_type') == 'bank':
            # Basic bank account validation (alphanumeric, spaces, hyphens)
            if not value.replace(' ', '').replace('-', '').isalnum():
                raise serializers.ValidationError(
                    "Bank account number should only contain letters, numbers, spaces, and hyphens."
                )
        else:  # mobile
            # Basic phone number validation
            if not value.replace('+', '').replace(' ', '').isdigit():
                raise serializers.ValidationError(
                    "Mobile money number should only contain digits and optional +."
                )
        return value
    
    def create(self, validated_data):
        """Create funding source with wallet from user context."""
        user = self.context['request'].user
        wallet, _ = Wallet.objects.get_or_create(user=user)
        validated_data['wallet'] = wallet
        return super().create(validated_data)


class FundingSourceCreateSerializer(FundingSourceSerializer):
    """Serializer for creating funding sources (includes sensitive data)."""

    account_identifier = serializers.CharField(
        max_length=50,
        write_only=True
    )

    class Meta(FundingSourceSerializer.Meta):
        fields = [
            'source_type', 'name', 'account_identifier',
            'account_holder_name', 'is_primary'
        ]
        read_only_fields = []

    def create(self, validated_data):
        # Auto-activate on creation — no real payment verification exists yet.
        # When the payment gateway is integrated (Phase 7), change this to
        # 'verification_pending' and trigger the gateway's verification flow.
        validated_data['status'] = 'active'
        return super().create(validated_data)


class FundingSourceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating funding source details."""
    
    class Meta:
        model = FundingSource
        fields = ['name', 'account_holder_name', 'is_primary', 'status']
