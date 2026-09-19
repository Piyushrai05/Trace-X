from pydantic import BaseModel
from app.schemas.recalls import BatchStatus

class TempReading(BaseModel):
    ts: str
    celsius: float

class BatchDetail(BaseModel):
    code: str
    ingredient: str
    status: BatchStatus
    supplier_name: str
    supplier_id: str
    qty_kg: float
    received_at: str
    expiry: str
    temp_readings: list[TempReading]
