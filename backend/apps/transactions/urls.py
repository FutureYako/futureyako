from django.urls import path
from . import views

app_name = 'transactions'

urlpatterns = [
    # Transactions
    path('', views.TransactionListView.as_view(), name='transaction-list'),
    path('<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    path('summary/', views.transaction_summary, name='transaction-summary'),
    path('export/', views.request_transaction_export, name='request-export'),
    path('export/<uuid:export_id>/', views.export_status, name='export-status'),
    
    # Manual transaction creation (for testing/admin)
    path('deposit/', views.create_deposit_transaction, name='create-deposit'),
    path('investment/', views.create_investment_transaction, name='create-investment'),
    
    # Withdrawals
    path('withdrawals/', views.WithdrawalRequestListCreateView.as_view(), name='withdrawal-list'),
    path('withdrawals/<uuid:pk>/', views.WithdrawalRequestDetailView.as_view(), name='withdrawal-detail'),
]
