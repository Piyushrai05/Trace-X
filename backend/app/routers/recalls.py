from fastapi import APIRouter, Query
from app.schemas.recalls import RecallListItem, ImpactSummary, GraphPayload, InitiateRecallResponse
from app.schemas.timeline import TimelineReplayResponse
from app.services import recall_service
from app.services.timeline_service import timeline_service

router = APIRouter()

@router.get('/recalls', response_model=list[RecallListItem])
async def list_recalls():
    return await recall_service.list_recalls()

@router.get('/recalls/{batch_code}/impact', response_model=ImpactSummary)
async def get_impact(batch_code: str):
    return await recall_service.get_impact(batch_code)

@router.get('/recalls/{batch_code}/graph', response_model=GraphPayload)
async def get_graph(batch_code: str, expand: str | None = None):
    return await recall_service.get_graph(batch_code, expand)

@router.get('/recalls/{batch_code}/timeline', response_model=TimelineReplayResponse)
async def get_timeline_replay(batch_code: str, bucket: str = Query('1h')):
    return await timeline_service.get_timeline_replay(batch_code, bucket)

@router.post('/recalls/{batch_code}/initiate', response_model=InitiateRecallResponse)
async def initiate_recall(batch_code: str):
    return await recall_service.initiate_recall(batch_code)

