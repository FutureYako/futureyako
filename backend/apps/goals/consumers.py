import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class GoalConsumer(AsyncWebsocketConsumer):
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
        self.group_name = f"user_{self.user_id}_goals"
        
        # Join user's goals group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Send initial goals data
        goals = await self.get_goals()
        await self.send(text_data=json.dumps({
            "type": "goals_initial",
            "data": goals
        }))
    
    async def disconnect(self, close_code):
        # Leave user's goals group only if we joined
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass
    
    @database_sync_to_async
    def get_goals(self):
        from .models import Goal
        goals = Goal.objects.filter(user_id=self.user_id)
        return [
            {
                "id": g.id,
                "name": g.name,
                "type": g.type,
                "current": str(g.current),
                "target": str(g.target),
                "status": g.status,
                "deadline": g.deadline.isoformat() if g.deadline else None,
            }
            for g in goals
        ]
    
    async def goal_update(self, event):
        # Send goal progress update to client
        await self.send(text_data=json.dumps({
            "type": "goal_update",
            "data": event["data"]
        }))
    
    async def goal_created(self, event):
        # Send new goal notification to client
        await self.send(text_data=json.dumps({
            "type": "goal_created",
            "data": event["data"]
        }))
    
    async def goal_completed(self, event):
        # Send goal completion notification to client
        await self.send(text_data=json.dumps({
            "type": "goal_completed",
            "data": event["data"]
        }))
    
    async def contribution_received(self, event):
        # Send contribution notification to client
        await self.send(text_data=json.dumps({
            "type": "contribution_received",
            "data": event["data"]
        }))
