from django.urls import re_path
from apps.transactions.consumers import TransactionConsumer
from apps.wallets.consumers import WalletConsumer
from apps.goals.consumers import GoalConsumer

websocket_urlpatterns = [
    re_path(r'ws/transactions/$', TransactionConsumer.as_asgi()),
    re_path(r'ws/wallet/$', WalletConsumer.as_asgi()),
    re_path(r'ws/goals/$', GoalConsumer.as_asgi()),
]
