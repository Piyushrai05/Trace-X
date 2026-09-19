from fastapi import APIRouter
from app.schemas.kitchens import KitchenSummary, KitchenDetail
from app.services import kitchens_service

router = APIRouter()

@router.get('/kitchens', response_model=list[KitchenSummary])
async def list_kitchens():
    return await kitchens_service.list_kitchens()

@router.get('/kitchens/{kitchen_id}', response_model=KitchenDetail)
async def get_kitchen(kitchen_id: str):
    return await kitchens_service.get_kitchen(kitchen_id)
