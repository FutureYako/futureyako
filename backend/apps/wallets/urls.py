from django.urls import path
from . import views

app_name = 'wallets'

urlpatterns = [
    path('me/', views.WalletDetailView.as_view(), name='wallet-detail'),
    path('funding-sources/', views.FundingSourceListCreateView.as_view(), name='funding-source-list'),
    path('funding-sources/<uuid:pk>/', views.FundingSourceDetailView.as_view(), name='funding-source-detail'),
    path('funding-sources/<uuid:pk>/set-primary/', views.set_primary_funding_source, name='set-primary-funding-source'),
]
