from fastapi import APIRouter
from app.schemas.overview import OverviewResponse
from app.services import overview_service

router = APIRouter()

@router.get('/overview', response_model=OverviewResponse)
async def get_overview():
    return await overview_service.get_overview()
