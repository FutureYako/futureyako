import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class TransactionConsumer(AsyncWebsocketConsumer):
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
        self.group_name = f"user_{self.user_id}_transactions"
        
        # Join user's transaction group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave user's transaction group only if we joined
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass
    
    async def transaction_update(self, event):
        # Send transaction update to client
        await self.send(text_data=json.dumps({
            "type": "transaction_update",
            "data": event["data"]
        }))
    
    async def transaction_created(self, event):
        # Send new transaction notification to client
        await self.send(text_data=json.dumps({
            "type": "transaction_created",
            "data": event["data"]
        }))
