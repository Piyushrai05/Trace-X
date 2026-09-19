from typing import Optional
from pydantic import BaseModel

class SupplierSummary(BaseModel):
    id: str
    name: str
    city: str
    category: str
    total_batches: int
    flagged_batches: int

class RecentBatch(BaseModel):
    code: str
    ingredient: Optional[str] = "Ingredient"
    status: str
    qty_kg: Optional[float] = 100.0
    received_at: Optional[str] = "2026-09-18T00:00:00"

class SupplierDetail(BaseModel):
    id: str
    name: str
    city: str
    category: str
    total_batches: int
    flagged_batches: int
    recent_batches: list[RecentBatch]
