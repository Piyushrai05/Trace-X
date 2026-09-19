from pydantic import BaseModel

class ComplaintItem(BaseModel):
    id: str
    text: str
    created_at: str
    order_id: str
    severity: str
