import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class WalletConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_id = None
        self.group_name = None
    
    async def connect(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if self.scope["user"].is_anonymous:
            await self.close()
            return
        
        self.user_id = self.scope["user"].id
        self.group_name = f"user_{self.user_id}_wallet"
        
        # Join user's wallet group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Send initial wallet data
        wallet = await self.get_wallet()
        if wallet:
            await self.send(text_data=json.dumps({
                "type": "wallet_initial",
                "data": {
                    "wallet_number": wallet.wallet_number,
                    "total_balance": str(wallet.total_balance),
                    "available_balance": str(wallet.available_balance),
                    "status": wallet.status,
                }
            }))
    
    async def disconnect(self, close_code):
        # Leave user's wallet group only if we joined
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass
    
    @database_sync_to_async
    def get_wallet(self):
        from .models import Wallet
        try:
            return Wallet.objects.get(user_id=self.user_id)
        except Wallet.DoesNotExist:
            return None
    
    async def wallet_update(self, event):
        # Send wallet balance update to client
        await self.send(text_data=json.dumps({
            "type": "wallet_update",
            "data": event["data"]
        }))
    
    async def deposit_received(self, event):
        # Send deposit notification to client
        await self.send(text_data=json.dumps({
            "type": "deposit_received",
            "data": event["data"]
        }))
    
    async def withdrawal_processed(self, event):
        # Send withdrawal notification to client
        await self.send(text_data=json.dumps({
            "type": "withdrawal_processed",
            "data": event["data"]
        }))
