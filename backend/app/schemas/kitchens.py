from pydantic import BaseModel

class KitchenSummary(BaseModel):
    id: str
    name: str
    city: str
    lat: float
    lng: float
    affected_batch_count: int

class BatchSummary(BaseModel):
    code: str
    ingredient: str
    status: str

class KitchenDetail(BaseModel):
    id: str
    name: str
    city: str
    lat: float
    lng: float
    active_batch_count: int
    affected_batch_count: int
    order_count_today: int
    inventory: list[BatchSummary]
