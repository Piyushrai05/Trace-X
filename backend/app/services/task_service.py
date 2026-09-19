from datetime import datetime, timezone
import time
from fastapi import HTTPException
from app.db import db
from app.schemas.tasks import (
    KitchenTaskItem,
    RecallTasksResponse,
    StatusCounts,
    UpdateTaskResponse,
    TaskStatus,
    RecallStatus,
    TASK_STATUS_FLOW,
)
from app.schemas.recalls import ImpactSummary
from app.services import recall_service


class TaskService:
    async def initiate_recall_workflow(self, batch_code: str, initiated_by: str = "Quality Lead") -> tuple[str, ImpactSummary]:
        now_str = datetime.now(timezone.utc).isoformat()
        
        # Verify batch exists
        check = await db.execute_read("MATCH (b:IngredientBatch {code: $code}) RETURN b.status AS status", {'code': batch_code})
        if not check:
            raise HTTPException(status_code=404, detail=f"Batch {batch_code} not found")
        
        prev_status = check[0]['status']

        # Set batch status to CRITICAL in graph
        await db.execute_write(
            "MATCH (b:IngredientBatch {code: $code}) SET b.status = 'CRITICAL' RETURN b",
            {'code': batch_code}
        )

        recall_id = f"REC_{batch_code.replace('-', '_')}"

        # Idempotently create Recall node
        create_recall_cypher = """
        MERGE (r:Recall {batch_code: $batch_code})
        ON CREATE SET r.id = $recall_id,
                      r.status = 'INITIATED',
                      r.initiated_at = $now,
                      r.initiated_by = $initiated_by
        WITH r
        MATCH (b:IngredientBatch {code: $batch_code})
        MERGE (r)-[:FOR_BATCH]->(b)
        RETURN r
        """
        await db.execute_write(create_recall_cypher, {
            'batch_code': batch_code,
            'recall_id': recall_id,
            'now': now_str,
            'initiated_by': initiated_by
        })

        # Find all affected kitchens
        kitchens_cypher = """
        MATCH (b:IngredientBatch {code: $code})-[:USED_IN]->(pl:PrepLot)-[:PREPARED_AT]->(k:Kitchen)
        RETURN DISTINCT k.id AS id, k.name AS name, k.city AS city, k.lat AS lat, k.lng AS lng
        """
        kitchens = await db.execute_read(kitchens_cypher, {'code': batch_code})
        if not kitchens:
            # Fallback query
            kitchens_fallback = await db.execute_read("MATCH (k:Kitchen) RETURN k.id AS id, k.name AS name, k.city AS city, k.lat AS lat, k.lng AS lng LIMIT 12", {})
            kitchens = kitchens_fallback

        # Idempotently create KitchenTask for each kitchen
        for k in kitchens:
            task_id = f"TASK_{batch_code.replace('-', '_')}_{k['id']}"
            create_task_cypher = """
            MATCH (r:Recall {batch_code: $batch_code})
            MATCH (k:Kitchen {id: $kitchen_id})
            MERGE (t:KitchenTask {id: $task_id})
            ON CREATE SET t.status = 'NOTIFIED',
                          t.updated_at = $now,
                          t.updated_by = 'System',
                          t.note = 'Batch quarantined. Pending kitchen manager acknowledgement.'
            MERGE (r)-[:HAS_TASK]->(t)
            MERGE (t)-[:FOR_KITCHEN]->(k)
            RETURN t
            """
            await db.execute_write(create_task_cypher, {
                'batch_code': batch_code,
                'kitchen_id': k['id'],
                'task_id': task_id,
                'now': now_str
            })

        # Write audit Event node
        event_cypher = """
        CREATE (e:Event {
            id: $event_id,
            type: 'RECALL_INITIATED',
            message: $message,
            ts: $now,
            severity: 'CRITICAL'
        })
        """
        await db.execute_write(event_cypher, {
            'event_id': f"EVT_REC_{int(time.time() * 1000)}",
            'message': f"Surgical recall initiated for batch {batch_code}. Quarantined {len(kitchens)} kitchen hubs.",
            'now': now_str
        })

        impact = await recall_service.get_impact(batch_code)
        return prev_status, impact

    async def get_recall_tasks(self, batch_code: str) -> RecallTasksResponse:
        # Check if recall exists
        recall_cypher = """
        MATCH (r:Recall {batch_code: $batch_code})
        RETURN r.id AS id, r.status AS status, r.initiated_at AS initiated_at, r.initiated_by AS initiated_by
        """
        rec_res = await db.execute_read(recall_cypher, {'batch_code': batch_code})
        
        # If recall hasn't been explicitly initiated yet, initialize it on-the-fly for seamless exploration
        if not rec_res:
            await self.initiate_recall_workflow(batch_code, initiated_by="Auto-Detector")
            rec_res = await db.execute_read(recall_cypher, {'batch_code': batch_code})

        rec_data = rec_res[0] if rec_res else {
            'id': f"REC_{batch_code.replace('-', '_')}",
            'status': 'INITIATED',
            'initiated_at': datetime.now(timezone.utc).isoformat(),
            'initiated_by': 'System'
        }

        # Query all tasks linked to this recall
        tasks_cypher = """
        MATCH (r:Recall {batch_code: $batch_code})-[:HAS_TASK]->(t:KitchenTask)-[:FOR_KITCHEN]->(k:Kitchen)
        RETURN t.id AS id, r.id AS recall_id, k.id AS kitchen_id, k.name AS kitchen_name,
               k.city AS kitchen_city, t.status AS status, t.updated_at AS updated_at,
               t.updated_by AS updated_by, t.note AS note, k.lat AS lat, k.lng AS lng
        ORDER BY k.city, k.name
        """
        tasks_res = await db.execute_read(tasks_cypher, {'batch_code': batch_code})
        
        counts = StatusCounts()
        tasks_list: list[KitchenTaskItem] = []
        
        for t in tasks_res:
            st = t['status']
            if st == 'NOTIFIED': counts.notified += 1
            elif st == 'ACKNOWLEDGED': counts.acknowledged += 1
            elif st == 'QUARANTINED': counts.quarantined += 1
            elif st == 'DISPOSED': counts.disposed += 1
            
            tasks_list.append(KitchenTaskItem(
                id=t['id'],
                recall_id=t.get('recall_id', rec_data['id']),
                kitchen_id=t['kitchen_id'],
                kitchen_name=t['kitchen_name'],
                kitchen_city=t['kitchen_city'],
                status=t['status'],
                updated_at=t['updated_at'],
                updated_by=t.get('updated_by') or 'System',
                note=t.get('note'),
                lat=t.get('lat'),
                lng=t.get('lng')
            ))

        total = len(tasks_list)
        pct = round((counts.disposed / total * 100), 1) if total > 0 else 0.0

        recall_status: RecallStatus = 'CONTAINED' if (total > 0 and counts.disposed == total) else (
            'IN_PROGRESS' if (counts.acknowledged > 0 or counts.quarantined > 0 or counts.disposed > 0) else 'INITIATED'
        )

        # Update recall status if needed
        if recall_status != rec_data['status']:
            await db.execute_write(
                "MATCH (r:Recall {batch_code: $batch_code}) SET r.status = $status RETURN r",
                {'batch_code': batch_code, 'status': recall_status}
            )

        return RecallTasksResponse(
            batch_code=batch_code,
            recall_id=rec_data['id'],
            recall_status=recall_status,
            initiated_at=rec_data['initiated_at'],
            initiated_by=rec_data['initiated_by'],
            total_kitchens=total,
            percent_complete=pct,
            status_counts=counts,
            tasks=tasks_list
        )

    async def update_task(self, task_id: str, new_status: TaskStatus, note: str | None = None, updated_by: str = "Kitchen Lead") -> UpdateTaskResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        
        # 1. Fetch current task
        query = """
        MATCH (r:Recall)-[:HAS_TASK]->(t:KitchenTask {id: $task_id})-[:FOR_KITCHEN]->(k:Kitchen)
        RETURN t.id AS id, t.status AS status, r.batch_code AS batch_code, r.id AS recall_id,
               k.id AS kitchen_id, k.name AS kitchen_name, k.city AS kitchen_city,
               k.lat AS lat, k.lng AS lng
        """
        res = await db.execute_read(query, {'task_id': task_id})
        if not res:
            raise HTTPException(status_code=404, detail=f"KitchenTask with ID {task_id} not found")

        current = res[0]
        curr_status: TaskStatus = current['status']
        batch_code: str = current['batch_code']

        # 2. Strict forward-only transition validation (NOTIFIED -> ACKNOWLEDGED -> QUARANTINED -> DISPOSED)
        if curr_status not in TASK_STATUS_FLOW or new_status not in TASK_STATUS_FLOW:
            raise HTTPException(status_code=400, detail=f"Invalid task status provided")

        curr_idx = TASK_STATUS_FLOW.index(curr_status)
        new_idx = TASK_STATUS_FLOW.index(new_status)

        if new_idx <= curr_idx:
            raise HTTPException(
                status_code=409,
                detail=f"Invalid transition from {curr_status} to {new_status}. Only forward transitions are allowed: " + " -> ".join(TASK_STATUS_FLOW)
            )

        # 3. Update task in graph
        update_cypher = """
        MATCH (t:KitchenTask {id: $task_id})
        SET t.status = $status,
            t.updated_at = $now,
            t.updated_by = $updated_by,
            t.note = $note
        RETURN t
        """
        await db.execute_write(update_cypher, {
            'task_id': task_id,
            'status': new_status,
            'now': now_str,
            'updated_by': updated_by,
            'note': note or f"Status advanced to {new_status}"
        })

        # 4. Write audit Event node
        event_cypher = """
        CREATE (e:Event {
            id: $event_id,
            type: 'TASK_TRANSITION',
            message: $message,
            ts: $now,
            severity: $severity
        })
        """
        sev = 'NORMAL' if new_status == 'DISPOSED' else ('WARNING' if new_status == 'QUARANTINED' else 'MONITORING')
        await db.execute_write(event_cypher, {
            'event_id': f"EVT_TASK_{int(time.time() * 1000)}",
            'message': f"Kitchen Hub {current['kitchen_name']} ({current['kitchen_city']}) updated batch {batch_code} task to {new_status}",
            'now': now_str,
            'severity': sev
        })

        # 5. Check if all tasks for this recall are now DISPOSED
        recall_tasks_data = await self.get_recall_tasks(batch_code)

        updated_item = KitchenTaskItem(
            id=task_id,
            recall_id=current['recall_id'],
            kitchen_id=current['kitchen_id'],
            kitchen_name=current['kitchen_name'],
            kitchen_city=current['kitchen_city'],
            status=new_status,
            updated_at=now_str,
            updated_by=updated_by,
            note=note,
            lat=current.get('lat'),
            lng=current.get('lng')
        )

        msg = f"Task successfully advanced to {new_status}."
        if recall_tasks_data.recall_status == 'CONTAINED':
            msg += f" All kitchen actions complete! Batch {batch_code} is now fully CONTAINED."

        return UpdateTaskResponse(
            task=updated_item,
            recall_status=recall_tasks_data.recall_status,
            percent_complete=recall_tasks_data.percent_complete,
            message=msg
        )


task_service = TaskService()
