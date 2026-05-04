from django.urls import path
from .. import views

urlpatterns = [
    # Profile
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/avatar/', views.upload_avatar, name='upload-avatar'),
    
    # Settings
    path('me/settings/', views.UserSettingsView.as_view(), name='user-settings'),
    path('me/notification-prefs/', views.NotificationPreferenceView.as_view(), name='notification-prefs'),
    path('me/change-password/', views.change_password, name='change-password'),
    
    # 2FA
    path('me/2fa/', views.twofa_status, name='twofa-status'),
    path('me/2fa/setup/', views.setup_2fa, name='setup-2fa'),
    path('me/2fa/verify/', views.verify_2fa, name='verify-2fa'),
    path('me/2fa/disable/', views.disable_2fa, name='disable-2fa'),
    path('me/2fa/backup-codes/', views.backup_codes, name='backup-codes'),
    
    # Sessions
    path('me/sessions/', views.LoginSessionListView.as_view(), name='login-sessions'),
    path('me/sessions/<uuid:session_id>/', views.logout_session, name='logout-session'),
    
    # Login history
    path('me/login-history/', views.LoginHistoryListView.as_view(), name='login-history'),
    
    # Onboarding
    path('me/onboarding/', views.OnboardingView.as_view(), name='onboarding'),
]
