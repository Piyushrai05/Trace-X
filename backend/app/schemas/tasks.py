from typing import Literal, Optional
from pydantic import BaseModel

TaskStatus = Literal['NOTIFIED', 'ACKNOWLEDGED', 'QUARANTINED', 'DISPOSED']
RecallStatus = Literal['INITIATED', 'IN_PROGRESS', 'CONTAINED']

TASK_STATUS_FLOW: list[TaskStatus] = ['NOTIFIED', 'ACKNOWLEDGED', 'QUARANTINED', 'DISPOSED']

class KitchenTaskItem(BaseModel):
    id: str
    recall_id: str
    kitchen_id: str
    kitchen_name: str
    kitchen_city: str
    status: TaskStatus
    updated_at: str
    updated_by: str = "System"
    note: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class StatusCounts(BaseModel):
    notified: int = 0
    acknowledged: int = 0
    quarantined: int = 0
    disposed: int = 0

class RecallTasksResponse(BaseModel):
    batch_code: str
    recall_id: str
    recall_status: RecallStatus
    initiated_at: str
    initiated_by: str
    total_kitchens: int
    percent_complete: float
    status_counts: StatusCounts
    tasks: list[KitchenTaskItem]

class UpdateTaskRequest(BaseModel):
    status: TaskStatus
    note: Optional[str] = None
    updated_by: Optional[str] = "Kitchen Lead"

class UpdateTaskResponse(BaseModel):
    task: KitchenTaskItem
    recall_status: RecallStatus
    percent_complete: float
    message: str
