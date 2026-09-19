import asyncio
import json
from typing import AsyncGenerator, Any

class EventBroadcaster:
    def __init__(self) -> None:
        self._listeners: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._listeners.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._listeners:
            self._listeners.remove(q)

    async def broadcast(self, event_type: str, data: dict[str, Any]) -> None:
        payload = {
            "type": event_type,
            "data": data
        }
        for q in list(self._listeners):
            try:
                await q.put(payload)
            except Exception:
                pass

    async def stream(self) -> AsyncGenerator[str, None]:
        q = self.subscribe()
        try:
            # Yield initial connection confirmation
            yield f"event: connected\ndata: {json.dumps({'status': 'connected'})}\n\n"
            while True:
                try:
                    # Wait for next event or send heartbeat every 15 seconds
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                    event_type = msg.get("type", "message")
                    data_str = json.dumps(msg.get("data", {}))
                    yield f"event: {event_type}\ndata: {data_str}\n\n"
                except asyncio.TimeoutError:
                    yield f"event: heartbeat\ndata: {json.dumps({'status': 'alive'})}\n\n"
        finally:
            self.unsubscribe(q)

event_broadcaster = EventBroadcaster()
