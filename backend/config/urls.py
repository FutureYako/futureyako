from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("django-admin/", admin.site.urls),

    # Auth endpoints
    path("api/auth/", include("apps.accounts.urls.auth")),
    path("api/users/", include("apps.accounts.urls.users")),

    # Wallet and funding sources
    path("api/wallets/", include("apps.wallets.urls")),

    # Goals (savings, emergency, group)
    path("api/goals/", include("apps.goals.urls")),

    # Investments (funds, holdings, portfolio)
    path("api/investments/", include("apps.investments.urls")),

    # Auto-save preferences and management
    path("api/saving-preferences/", include("apps.autosave.urls")),

    # Transactions and withdrawals
    path("api/transactions/", include("apps.transactions.urls")),

    # Notifications
    path("api/notifications/", include("apps.notifications.urls")),

    # Admin panel endpoints
    path("api/admin/", include("apps.admin_panel.urls")),

    # Webhooks
    path("api/webhooks/", include("apps.webhooks.urls")),

    # Ultraner payment gateway (MNO, bank deposits + webhook)
    path("api/payments/", include("apps.payments.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
