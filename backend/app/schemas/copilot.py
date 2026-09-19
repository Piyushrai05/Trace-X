from typing import Any, Optional
from pydantic import BaseModel


class RegulatoryNoticeRequest(BaseModel):
    batch_code: str
    ingredient: str = "Paneer"
    supplier_name: str = "Supplier A (Sharma Dairy)"
    kitchen_count: int = 12
    order_count: int = 1842
    customer_count: int = 2913
    temp_spike_celsius: float = 14.2
    incident_type: str = "Microbiological Contamination (Cold-Chain Breach)"
    language: Optional[str] = "English"


class RegulatoryNoticeResponse(BaseModel):
    batch_code: str
    fssai_notice_markdown: str
    customer_sms_template: str
    executive_summary_bullets: list[str]
    brand_financial_savings: dict[str, Any]


class ContainmentDispatchRequest(BaseModel):
    batch_code: str
    channels: Optional[list[str]] = ["pos_auto_86", "rider_intercept", "customer_advisory", "inventory_lock"]
    action_channels: Optional[list[str]] = None


class ContainmentDispatchResponse(BaseModel):
    batch_code: str
    status: str
    containment_percentage: float
    elapsed_seconds: float
    channels_dispatched: list[dict[str, Any]]
