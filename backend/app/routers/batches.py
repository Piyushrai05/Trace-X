from fastapi import APIRouter
from app.schemas.batches import BatchDetail
from app.services import batches_service

router = APIRouter()

@router.get('/batches/{code}', response_model=BatchDetail)
async def get_batch_detail(code: str):
    return await batches_service.get_batch_detail(code)
