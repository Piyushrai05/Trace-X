from pydantic import BaseModel
from app.schemas.recalls import RecallListItem


class CityCluster(BaseModel):
    city: str
    lat: float
    lng: float
    kitchen_count: int
    has_critical: bool
    has_monitoring: bool


class ActivityItem(BaseModel):
    id: str
    type: str
    message: str
    ts: str
    severity: str


class OverviewResponse(BaseModel):
    kitchen_count: int
    active_batch_count: int
    order_count: int
    active_recall_count: int
    city_clusters: list[CityCluster]
    recent_activity: list[ActivityItem]
    active_recalls: list[RecallListItem] = []
