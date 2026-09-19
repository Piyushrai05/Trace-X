from typing import Any, Optional
from pydantic import BaseModel
from app.schemas.recalls import ImpactSummary

class SimulateIncidentRequest(BaseModel):
    batch_code: Optional[str] = None
    cause: Optional[str] = "Cold-chain temperature excursion in transit"

class SimulateIncidentResponse(BaseModel):
    batch_code: str
    previous_status: str
    new_status: str
    temp_reading_celsius: float
    events_written: list[str]
    impact: ImpactSummary
    message: str

class ResetDemoResponse(BaseModel):
    status: str
    restored_batches_count: int
    cleared_recalls_count: int
    cleared_tasks_count: int
    cleared_events_count: int
    message: str
