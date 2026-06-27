import json
from fastapi import WebSocket
from collections import defaultdict


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)
        self.user_conversations: dict[str, set[str]] = defaultdict(set)

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        conns = self.active_connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not self.active_connections.get(user_id):
            self.active_connections.pop(user_id, None)
            self.user_conversations.pop(user_id, None)

    def subscribe(self, user_id: str, conversation_id: str):
        self.user_conversations[user_id].add(conversation_id)

    def unsubscribe(self, user_id: str, conversation_id: str):
        if user_id in self.user_conversations:
            self.user_conversations[user_id].discard(conversation_id)

    def get_online_users(self, user_ids: list[str]) -> list[str]:
        return [uid for uid in user_ids if uid in self.active_connections and self.active_connections[uid]]

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and bool(self.active_connections[user_id])

    async def send_to_user(self, user_id: str, data: dict):
        for ws in self.active_connections.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def broadcast_to_users(self, user_ids: list[str], data: dict):
        for uid in user_ids:
            await self.send_to_user(uid, data)

    async def broadcast_to_conversation(self, conversation_id: str, data: dict):
        for uid, convs in self.user_conversations.items():
            if conversation_id in convs:
                await self.send_to_user(uid, data)


manager = ConnectionManager()
