"""
Real-time subscription service for live updates.
Supports WebSocket connections for live transcript streaming, tool calls, and events.
"""
from typing import Dict, Any, List, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
from logging_config import get_logger

logger = get_logger("realtime")


class SubscriptionManager:
    """Manages real-time subscriptions for live updates."""
    
    def __init__(self):
        """Initialize subscription manager."""
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.subscription_types = [
            "transcript",
            "tool_calls",
            "missed_calls",
            "recovery_activity",
            "call_status"
        ]
    
    async def connect(
        self,
        websocket: WebSocket,
        subscription_id: str,
        subscription_types: List[str]
    ):
        """
        Connect a WebSocket client with subscription types.
        
        Args:
            websocket: WebSocket connection
            subscription_id: Unique subscription ID (e.g., operator_id, session_id)
            subscription_types: List of types to subscribe to
        """
        await websocket.accept()
        
        if subscription_id not in self.active_connections:
            self.active_connections[subscription_id] = []
        
        # Store subscription metadata
        websocket.subscription_types = subscription_types
        websocket.subscription_id = subscription_id
        
        self.active_connections[subscription_id].append(websocket)
        logger.info(f"WebSocket connected: {subscription_id} (types: {subscription_types})")
    
    def disconnect(self, websocket: WebSocket, subscription_id: str):
        """Disconnect a WebSocket client."""
        if subscription_id in self.active_connections:
            if websocket in self.active_connections[subscription_id]:
                self.active_connections[subscription_id].remove(websocket)
            
            if len(self.active_connections[subscription_id]) == 0:
                del self.active_connections[subscription_id]
        
        logger.info(f"WebSocket disconnected: {subscription_id}")
    
    async def broadcast_to_subscription(
        self,
        subscription_id: str,
        event_type: str,
        data: Dict[str, Any]
    ):
        """
        Broadcast an event to all connections for a subscription.
        
        Args:
            subscription_id: Subscription ID
            event_type: Type of event (transcript, tool_calls, etc.)
            data: Event data
        """
        if subscription_id not in self.active_connections:
            return
        
        message = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        disconnected = []
        for websocket in self.active_connections[subscription_id]:
            try:
                # Check if connection subscribes to this event type
                if hasattr(websocket, 'subscription_types'):
                    if event_type in websocket.subscription_types or "all" in websocket.subscription_types:
                        await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {str(e)}")
                disconnected.append(websocket)
        
        # Remove disconnected connections
        for ws in disconnected:
            self.disconnect(ws, subscription_id)
    
    async def broadcast_transcript(
        self,
        subscription_id: str,
        transcript_data: Dict[str, Any]
    ):
        """
        Broadcast transcript update.
        
        Args:
            subscription_id: Subscription ID (operator_id or session_id)
            transcript_data: Dict with transcript information
        """
        await self.broadcast_to_subscription(
            subscription_id,
            "transcript",
            {
                **transcript_data,
                "ready_for_frontend": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def broadcast_tool_call(
        self,
        subscription_id: str,
        tool_call_data: Dict[str, Any]
    ):
        """
        Broadcast tool call event.
        
        Args:
            subscription_id: Subscription ID
            tool_call_data: Dict with tool call information
        """
        await self.broadcast_to_subscription(
            subscription_id,
            "tool_calls",
            {
                **tool_call_data,
                "ready_for_frontend": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def broadcast_missed_call(
        self,
        subscription_id: str,
        missed_call_data: Dict[str, Any]
    ):
        """Broadcast missed call detection."""
        await self.broadcast_to_subscription(
            subscription_id,
            "missed_calls",
            missed_call_data
        )
    
    async def broadcast_recovery_activity(
        self,
        subscription_id: str,
        recovery_data: Dict[str, Any]
    ):
        """
        Broadcast recovery activity updates.
        
        Args:
            subscription_id: Subscription ID
            recovery_data: Dict with recovery information
        """
        await self.broadcast_to_subscription(
            subscription_id,
            "recovery_activity",
            {
                **recovery_data,
                "ready_for_frontend": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def broadcast_call_status(
        self,
        subscription_id: str,
        status_data: Dict[str, Any]
    ):
        """Broadcast call status change."""
        await self.broadcast_to_subscription(
            subscription_id,
            "call_status",
            status_data
        )
    
    def get_active_subscriptions(self) -> Dict[str, int]:
        """Get count of active subscriptions per ID."""
        return {
            sub_id: len(connections)
            for sub_id, connections in self.active_connections.items()
        }


# Global instance
subscription_manager = SubscriptionManager()
