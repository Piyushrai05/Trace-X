from fastapi import APIRouter
from app.schemas.investigations import ReverseInvestigationRequest, ReverseInvestigationResponse
from app.services import investigation_service

router = APIRouter()

@router.post('/investigations/reverse', response_model=ReverseInvestigationResponse)
async def run_reverse_investigation(req: ReverseInvestigationRequest):
    return await investigation_service.run_reverse_investigation(req.complaint_ids)
