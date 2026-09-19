from pydantic import BaseModel
from app.schemas.recalls import GraphPayload

class ReverseInvestigationRequest(BaseModel):
    complaint_ids: list[str]

class StageCounts(BaseModel):
    complaints: int
    orders: int
    dishes: int
    prep_lots: int
    batches: int
    suppliers: int

class CandidateBatch(BaseModel):
    batch_code: str
    ingredient: str
    supplier_name: str
    complaint_count: int
    confidence_score: float

class ReverseInvestigationResponse(BaseModel):
    stage_counts: StageCounts
    candidates: list[CandidateBatch]
    graph: GraphPayload
    disclaimer: str = 'Potential common source identified. This is an analytical indicator only, not a definitive cause.'
