from typing import Literal
from pydantic import BaseModel, Field

BatchStatus = Literal['NORMAL', 'MONITORING', 'WARNING', 'CRITICAL', 'RESOLVED']

class RecallListItem(BaseModel):
    code: str
    ingredient: str
    status: BatchStatus
    supplier_name: str
    supplier_id: str
    qty_kg: float
    received_at: str
    expiry: str
    kitchen_count: int
    order_count: int

class ImpactSummary(BaseModel):
    batch_code: str
    ingredient: str
    status: str
    supplier_name: str
    kitchen_count: int
    prep_lot_count: int
    dish_count: int
    order_count: int
    customer_count: int
    elapsed_ms: float

class GraphNode(BaseModel):
    id: str
    type: Literal['supplier','batch','prep_lot','kitchen','dish','order_aggregate','customer_aggregate', 'order', 'customer']
    label: str
    data: dict

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str

class GraphPayload(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    meta: dict

class InitiateRecallResponse(BaseModel):
    batch_code: str
    previous_status: str
    new_status: str
    impact: ImpactSummary
