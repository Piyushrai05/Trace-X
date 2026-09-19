import pytest
from fastapi import HTTPException
from app.services.task_service import task_service
from app.db import db
from app.config import settings

@pytest.mark.asyncio
async def test_initiate_recall_workflow_idempotency():
    await db.connect(settings)
    try:
        # 1. First call creates recall & tasks
        prev_1, impact_1 = await task_service.initiate_recall_workflow('PNR-2047')
        assert impact_1.batch_code == 'PNR-2047'
        
        # 2. Second call should be idempotent (no duplicate errors)
        prev_2, impact_2 = await task_service.initiate_recall_workflow('PNR-2047')
        assert impact_2.batch_code == 'PNR-2047'

        # 3. Check tasks list
        tasks_res = await task_service.get_recall_tasks('PNR-2047')
        assert tasks_res.total_kitchens > 0
        assert len(tasks_res.tasks) == tasks_res.total_kitchens
    finally:
        await db.close()

@pytest.mark.asyncio
async def test_task_status_forward_transition_rules():
    await db.connect(settings)
    try:
        tasks_res = await task_service.get_recall_tasks('PNR-2047')
        first_task = tasks_res.tasks[0]
        
        # Advance NOTIFIED -> ACKNOWLEDGED (valid)
        res1 = await task_service.update_task(first_task.id, 'ACKNOWLEDGED', note="Kitchen lead received alert")
        assert res1.task.status == 'ACKNOWLEDGED'

        # Advance ACKNOWLEDGED -> QUARANTINED (valid)
        res2 = await task_service.update_task(first_task.id, 'QUARANTINED', note="Stored in bio-hazard sealed freezer")
        assert res2.task.status == 'QUARANTINED'

        # Attempt backward transition QUARANTINED -> NOTIFIED (must reject with 409 Conflict)
        with pytest.raises(HTTPException) as exc_info:
            await task_service.update_task(first_task.id, 'NOTIFIED')
        assert exc_info.value.status_code == 409
        assert "Only forward transitions" in exc_info.value.detail

        # Advance QUARANTINED -> DISPOSED (valid)
        res3 = await task_service.update_task(first_task.id, 'DISPOSED', note="Safely incinerated per FSSAI procedure")
        assert res3.task.status == 'DISPOSED'
    finally:
        await db.close()
