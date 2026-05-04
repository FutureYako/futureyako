from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # Overview
    path('overview/', views.overview_stats, name='overview'),
    path('charts/', views.chart_data, name='chart-data'),

    # User management
    path('users/', views.user_management, name='user-management'),
    path('users/<uuid:user_id>/', views.user_detail, name='user-detail'),
    path('users/<uuid:user_id>/suspend/', views.suspend_user, name='suspend-user'),
    path('users/<uuid:user_id>/activate/', views.activate_user, name='activate-user'),
    path('users/<uuid:user_id>/make-admin/', views.make_admin, name='make-admin'),
    path('users/<uuid:user_id>/revoke-admin/', views.revoke_admin, name='revoke-admin'),
    path('users/<uuid:user_id>/delete/', views.delete_user, name='delete-user'),

    # Investment funds
    path('funds/', views.InvestmentFundListCreateView.as_view(), name='fund-list'),
    path('funds/<uuid:pk>/', views.InvestmentFundDetailView.as_view(), name='fund-detail'),

    # Goals
    path('goals/', views.admin_goals, name='admin-goals'),

    # Transactions
    path('transactions/', views.admin_transactions, name='admin-transactions'),

    # Withdrawals
    path('withdrawals/', views.WithdrawalRequestListView.as_view(), name='withdrawal-list'),
    path('withdrawals/<uuid:withdrawal_id>/approve/', views.approve_withdrawal, name='approve-withdrawal'),
    path('withdrawals/<uuid:withdrawal_id>/reject/', views.reject_withdrawal, name='reject-withdrawal'),

    # Broadcast
    path('broadcast/', views.BroadcastListCreateView.as_view(), name='broadcast'),

    # Payment providers (admin CRUD)
    path('payment-providers/banks/', views.PaymentProviderListCreateView.as_view(), {'provider_type': 'bank'}, name='bank-list'),
    path('payment-providers/banks/<uuid:pk>/', views.PaymentProviderDetailView.as_view(), name='bank-detail'),
    path('payment-providers/mobile/', views.PaymentProviderListCreateView.as_view(), {'provider_type': 'mobile'}, name='mobile-list'),
    path('payment-providers/mobile/<uuid:pk>/', views.PaymentProviderDetailView.as_view(), name='mobile-detail'),

    # Payment providers (public read — any authenticated user)
    path('providers/banks/', views.public_payment_providers, {'provider_type': 'bank'}, name='public-bank-list'),
    path('providers/mobile/', views.public_payment_providers, {'provider_type': 'mobile'}, name='public-mobile-list'),

    # Platform settings
    path('settings/', views.PlatformSettingsDetailView.as_view(), name='platform-settings'),

    # System alerts
    path('alerts/', views.SystemAlertListCreateView.as_view(), name='alert-list'),
    path('alerts/<uuid:pk>/', views.SystemAlertDetailView.as_view(), name='alert-detail'),
    path('alerts/<uuid:alert_id>/dismiss/', views.dismiss_alert, name='dismiss-alert'),

    # Activity logs
    path('activity/', views.AdminActivityLogListView.as_view(), name='activity-logs'),

    # Monthly stats
    path('stats/', views.MonthlyStatsListView.as_view(), name='monthly-stats'),
    path('stats/generate/', views.generate_monthly_stats, name='generate-stats'),
]
