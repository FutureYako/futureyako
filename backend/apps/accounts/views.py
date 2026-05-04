from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import User, UserSettings, NotificationPreference, TwoFactorAuth, LoginSession, LoginHistory, OnboardingProgress
from .serializers import (
    SignupSerializer, LoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    UserProfileSerializer, AvatarUploadSerializer, OnboardingSerializer,
    UserSettingsSerializer, NotificationPreferenceSerializer,
    ChangePasswordSerializer, TwoFASetupSerializer, TwoFAVerifySerializer, TwoFADisableSerializer,
    LoginSessionSerializer, LoginHistorySerializer
)
from common.utils import generate_wallet_number
from apps.wallets.models import Wallet


# Authentication endpoints
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """User registration endpoint."""
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.save()
    
    # Create related objects (use get_or_create to handle existing objects)
    UserSettings.objects.get_or_create(user=user)
    NotificationPreference.objects.get_or_create(user=user)
    OnboardingProgress.objects.get_or_create(user=user)
    
    # Create wallet
    wallet, created = Wallet.objects.get_or_create(
        user=user,
        defaults={'wallet_number': generate_wallet_number()}
    )
    if not created:
        # Generate new wallet number if wallet already exists
        wallet.wallet_number = generate_wallet_number()
        wallet.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Create login session
    create_login_session(request, user, "Web")
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserProfileSerializer(user).data,
        'wallet_number': wallet.wallet_number
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    
    # Check if 2FA is enabled
    try:
        two_factor = user.two_factor
        if two_factor.is_enabled:
            # Return temp token requiring 2FA completion
            from rest_framework_simplejwt.tokens import AccessToken
            from datetime import timedelta
            
            temp_token = AccessToken.for_user(user)
            temp_token.set_exp(lifetime=timedelta(minutes=5))
            
            return Response({
                'requires_2fa': True,
                'temp_token': str(temp_token)
            }, status=status.HTTP_200_OK)
    except TwoFactorAuth.DoesNotExist:
        pass
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Create login session and history
    device_name = request.data.get('device_name', 'Unknown Device')
    create_login_session(request, user, device_name)
    create_login_history(request, user, device_name, True)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserProfileSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_2fa_login(request):
    """Complete login with 2FA code."""
    from rest_framework_simplejwt.tokens import AccessToken
    
    temp_token = request.data.get('temp_token')
    code = request.data.get('code')
    
    if not temp_token or not code:
        return Response(
            {'error': 'temp_token and code are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verify temp token and get user
        token = AccessToken(temp_token)
        user_id = token['user_id']
        user = User.objects.get(id=user_id)
        
        # Verify 2FA code
        two_factor = user.two_factor
        import pyotp
        totp = pyotp.TOTP(two_factor.secret_key)
        
        if not totp.verify(code):
            # Check backup codes
            if code not in two_factor.backup_codes:
                return Response(
                    {'error': 'Invalid 2FA code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            two_factor.backup_codes.remove(code)
            two_factor.save()
        
        # Generate real tokens
        refresh = RefreshToken.for_user(user)
        
        # Create login session and history
        device_name = request.data.get('device_name', 'Unknown Device')
        create_login_session(request, user, device_name)
        create_login_history(request, user, device_name, True)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Invalid or expired temp token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh JWT token."""
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response(
            {'error': 'refresh token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token)
        })
    except Exception:
        return Response(
            {'error': 'Invalid refresh token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user and blacklist refresh token."""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Mark current session as not current
        current_sessions = request.user.sessions.filter(is_current=True)
        current_sessions.update(is_current=False)
        
        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK
        )
    except Exception:
        return Response(
            {'error': 'Invalid refresh token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Password management
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset email."""
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    serializer.send_reset_email(request)
    
    return Response(
        {'message': 'If an account with this email exists, a reset link has been sent.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token."""
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    serializer.save()
    
    return Response(
        {'message': 'Password reset successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password."""
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    serializer.save()
    
    return Response(
        {'message': 'Password changed successfully.'},
        status=status.HTTP_200_OK
    )


# Profile endpoints
class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update user profile."""
    
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Upload user avatar."""
    serializer = AvatarUploadSerializer(
        instance=request.user,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(
        UserProfileSerializer(request.user).data,
        status=status.HTTP_200_OK
    )


# Settings endpoints
class UserSettingsView(generics.RetrieveUpdateAPIView):
    """Get or update user settings."""
    
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """Get or update notification preferences."""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        prefs, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return prefs


# 2FA endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def twofa_status(request):
    """Get 2FA status."""
    try:
        two_factor = request.user.two_factor
        return Response({
            'is_enabled': two_factor.is_enabled,
            'setup_verified': two_factor.setup_verified
        })
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'is_enabled': False,
            'setup_verified': False
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    """Setup 2FA - returns QR code and secret."""
    serializer = TwoFASetupSerializer(
        data={},
        context={'request': request},
        user=request.user
    )
    
    try:
        result = serializer.create({})
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa(request):
    """Verify 2FA setup and enable it."""
    serializer = TwoFAVerifySerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    result = serializer.save()
    return Response(result, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """Disable 2FA."""
    serializer = TwoFADisableSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    result = serializer.save()
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_codes(request):
    """Get remaining backup codes."""
    try:
        two_factor = request.user.two_factor
        return Response({
            'backup_codes': two_factor.backup_codes
        })
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'backup_codes': []
        })


# Session endpoints
class LoginSessionListView(generics.ListAPIView):
    """List user's login sessions."""
    
    serializer_class = LoginSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.request.user.sessions.all()


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def logout_session(request, session_id):
    """Logout a specific session."""
    session = get_object_or_404(
        LoginSession,
        id=session_id,
        user=request.user
    )
    session.delete()
    
    return Response(
        {'message': 'Session logged out successfully.'},
        status=status.HTTP_200_OK
    )


class LoginHistoryListView(generics.ListAPIView):
    """List user's login history."""
    
    serializer_class = LoginHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.request.user.login_history.all()


# Onboarding
class OnboardingView(generics.RetrieveUpdateAPIView):
    """Get or update onboarding progress."""
    
    serializer_class = OnboardingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        progress, created = OnboardingProgress.objects.get_or_create(user=self.request.user)
        return progress


# Helper functions
def create_login_session(request, user, device_name):
    """Create a new login session."""
    # Get location from IP (simplified)
    ip_address = get_client_ip(request)
    location = get_location_from_ip(ip_address)
    
    # Mark other sessions as not current
    user.sessions.filter(is_current=True).update(is_current=False)
    
    # Create new session
    session = LoginSession.objects.create(
        user=user,
        session_key=generate_session_key(),
        device_name=device_name,
        location=location,
        is_current=True
    )
    
    return session


def create_login_history(request, user, device_name, is_successful, failure_reason=None):
    """Create login history entry."""
    ip_address = get_client_ip(request)
    location = get_location_from_ip(ip_address)

    LoginHistory.objects.create(
        user=user,
        device=device_name,
        location=location,
        ip_address=ip_address,
        is_successful=is_successful,
        failure_reason=failure_reason or ''
    )


def get_client_ip(request):
    """Get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_location_from_ip(ip):
    """Get location from IP (simplified)."""
    # In production, use a geolocation service
    return "Unknown Location"


def generate_session_key():
    """Generate a unique session key."""
    import secrets
    return secrets.token_urlsafe(32)
