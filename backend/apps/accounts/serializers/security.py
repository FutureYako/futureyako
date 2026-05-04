from rest_framework import serializers
from apps.accounts.models import LoginSession, LoginHistory, TwoFactorAuth
from common.utils import validate_password_strength


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        errors = validate_password_strength(data["new_password"])
        if errors:
            raise serializers.ValidationError({"new_password": errors})
        return data

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()


class TwoFASetupSerializer(serializers.Serializer):
    """Returns the QR URI and plain secret for the authenticator app."""
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
    
    def create(self, validated_data):
        import pyotp
        import qrcode
        from io import BytesIO
        import base64
        
        # Generate secret
        secret = pyotp.random_base32()
        
        # Save encrypted secret (for now, just store as is - in production encrypt)
        two_factor, created = TwoFactorAuth.objects.get_or_create(
            user=self.user,
            defaults={'secret_key': secret}
        )
        two_factor.secret_key = secret
        two_factor.setup_verified = False
        two_factor.save()
        
        # Generate QR code URI
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=self.user.email,
            issuer_name="SaveWise"
        )
        
        # Generate QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'qr_uri': provisioning_uri,
            'qr_code': f"data:image/png;base64,{qr_code_base64}",
            'secret': secret,
            'backup_codes': self.generate_backup_codes()
        }
    
    def generate_backup_codes(self):
        import secrets
        import string
        
        codes = []
        for _ in range(10):
            code = ''.join(secrets.choice(string.digits) for _ in range(8))
            codes.append(code)
        
        # Save backup codes to user's 2FA record
        self.user.two_factor.backup_codes = codes
        self.user.two_factor.save()
        
        return codes


class TwoFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Code must be 6 digits.")
        return value
    
    def validate(self, attrs):
        user = self.context['request'].user
        code = attrs['code']
        
        try:
            two_factor = user.two_factor
        except TwoFactorAuth.DoesNotExist:
            raise serializers.ValidationError("2FA is not set up for this account.")
        
        import pyotp
        totp = pyotp.TOTP(two_factor.secret_key)
        
        if not totp.verify(code):
            # Check backup codes
            if code in two_factor.backup_codes:
                two_factor.backup_codes.remove(code)
                two_factor.save()
            else:
                raise serializers.ValidationError("Invalid verification code.")
        
        return attrs
    
    def save(self, **kwargs):
        user = self.context['request'].user
        two_factor = user.two_factor
        two_factor.is_enabled = True
        two_factor.setup_verified = True
        two_factor.save()

        return {'message': '2FA enabled successfully'}


class TwoFADisableSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)
    
    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Code must be 6 digits.")
        return value
    
    def validate(self, attrs):
        user = self.context['request'].user
        code = attrs['code']
        
        try:
            two_factor = user.two_factor
        except TwoFactorAuth.DoesNotExist:
            raise serializers.ValidationError("2FA is not set up for this account.")
        
        import pyotp
        totp = pyotp.TOTP(two_factor.secret_key)
        
        if not totp.verify(code):
            # Check backup codes
            if code in two_factor.backup_codes:
                two_factor.backup_codes.remove(code)
                two_factor.save()
            else:
                raise serializers.ValidationError("Invalid verification code.")
        
        return attrs
    
    def save(self, **kwargs):
        user = self.context['request'].user
        two_factor = user.two_factor
        two_factor.is_enabled = False
        two_factor.secret_key = ''
        two_factor.backup_codes = []
        two_factor.save()

        return {'message': '2FA disabled successfully'}


class LoginSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginSession
        fields = ("id", "device_name", "location", "last_active", "is_current")


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ("id", "device", "location", "ip_address", "is_successful", "failure_reason", "login_at")
