from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.event_broadcaster import event_broadcaster

router = APIRouter()

@router.get('/stream')
async def sse_event_stream():
    return StreamingResponse(
        event_broadcaster.stream(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )
