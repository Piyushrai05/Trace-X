from typing import Any, Optional
from pydantic import BaseModel
from app.schemas.recalls import GraphPayload

class AskGraphRequest(BaseModel):
    question: str

class AskGraphResponse(BaseModel):
    question: str
    answer_summary: str
    cypher: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    graph: Optional[GraphPayload] = None
    execution_time_ms: float
    disclaimer: str = "AI-generated query, review before relying on it."
