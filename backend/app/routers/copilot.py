from fastapi import APIRouter
from app.schemas.copilot import (
    RegulatoryNoticeRequest,
    RegulatoryNoticeResponse,
    ContainmentDispatchRequest,
    ContainmentDispatchResponse,
)
from app.services.ai_copilot_service import ai_copilot_service

router = APIRouter()


@router.post("/copilot/generate-notice", response_model=RegulatoryNoticeResponse)
async def generate_regulatory_notice(payload: RegulatoryNoticeRequest) -> RegulatoryNoticeResponse:
    return ai_copilot_service.generate_regulatory_package(payload)


@router.post("/copilot/containment-dispatch", response_model=ContainmentDispatchResponse)
async def dispatch_containment(payload: ContainmentDispatchRequest) -> ContainmentDispatchResponse:
    return ai_copilot_service.dispatch_emergency_containment(payload)
