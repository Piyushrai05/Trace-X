from fastapi import APIRouter
from app.schemas.demo import (
    SimulateIncidentRequest,
    SimulateIncidentResponse,
    ResetDemoResponse
)
from app.services.demo_service import demo_service

router = APIRouter()

@router.post('/demo/simulate-incident', response_model=SimulateIncidentResponse)
async def simulate_incident(payload: SimulateIncidentRequest = SimulateIncidentRequest()):
    return await demo_service.simulate_incident(payload)

@router.post('/demo/reset', response_model=ResetDemoResponse)
async def reset_demo():
    return await demo_service.reset_demo()
