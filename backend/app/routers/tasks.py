from fastapi import APIRouter
from app.schemas.tasks import RecallTasksResponse, UpdateTaskRequest, UpdateTaskResponse
from app.services.task_service import task_service

router = APIRouter()

@router.get('/recalls/{batch_code}/tasks', response_model=RecallTasksResponse)
async def get_recall_tasks(batch_code: str):
    return await task_service.get_recall_tasks(batch_code)

@router.patch('/tasks/{task_id}', response_model=UpdateTaskResponse)
async def update_task(task_id: str, payload: UpdateTaskRequest):
    return await task_service.update_task(
        task_id=task_id,
        new_status=payload.status,
        note=payload.note,
        updated_by=payload.updated_by or "Kitchen Lead"
    )
