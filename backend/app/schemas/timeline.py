from typing import Any
from pydantic import BaseModel

class TimelineBucket(BaseModel):
    bucket_index: int
    timestamp: str
    hour_label: str
    cumulative_kitchens: int
    cumulative_prep_lots: int
    cumulative_dishes: int
    cumulative_orders: int
    cumulative_customers: int
    new_node_ids: list[str]
    stage_event: str | None = None

class TimelineReplayResponse(BaseModel):
    batch_code: str
    ingredient: str
    received_at: str
    flagged_at: str
    exposure_window_hours: float
    total_buckets: int
    buckets: list[TimelineBucket]
    nodes_meta: dict[str, dict[str, Any]]
