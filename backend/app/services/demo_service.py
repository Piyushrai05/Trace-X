from datetime import datetime, timezone
import time
from fastapi import HTTPException
from app.config import settings
from app.db import db
from app.schemas.demo import (
    SimulateIncidentRequest,
    SimulateIncidentResponse,
    ResetDemoResponse
)
from app.schemas.recalls import ImpactSummary
from app.services import recall_service
from app.services.event_broadcaster import event_broadcaster


class DemoService:
    def _ensure_demo_enabled(self) -> None:
        if not settings.demo_mode:
            raise HTTPException(status_code=404, detail="Demo mode is disabled on this server.")

    async def simulate_incident(self, req: SimulateIncidentRequest) -> SimulateIncidentResponse:
        self._ensure_demo_enabled()
        now_str = datetime.now(timezone.utc).isoformat()
        
        target_code = req.batch_code or "PNR-2047"
        
        # Check existing status
        check = await db.execute_read("MATCH (b:IngredientBatch {code: $code}) RETURN b.status AS status", {'code': target_code})
        if not check:
            # Fallback pick any NORMAL batch
            pick = await db.execute_read("MATCH (b:IngredientBatch WHERE b.status = 'NORMAL') RETURN b.code AS code LIMIT 1", {})
            if pick:
                target_code = pick[0]['code']
            else:
                target_code = "PNR-2047"
            prev_status = "NORMAL"
        else:
            prev_status = check[0]['status']

        temp_spike = 14.8

        # 1. Update batch in graph with demo=true and prev_status stored
        update_cypher = """
        MATCH (b:IngredientBatch {code: $code})
        SET b.status = 'CRITICAL',
            b.demo = true,
            b.original_status = coalesce(b.original_status, $prev_status)
        RETURN b
        """
        await db.execute_write(update_cypher, {'code': target_code, 'prev_status': prev_status})

        # 2. Append over-threshold temperature reading
        temp_cypher = """
        MATCH (b:IngredientBatch {code: $code})
        CREATE (t:TempReading {
            id: $temp_id,
            ts: $now,
            celsius: $temp_celsius,
            demo: true
        })
        MERGE (b)-[:HAS_TEMP]->(t)
        RETURN t
        """
        await db.execute_write(temp_cypher, {
            'code': target_code,
            'temp_id': f"TEMP_DEMO_{int(time.time()*1000)}",
            'now': now_str,
            'temp_celsius': temp_spike
        })

        # 3. Write Event nodes: "Temperature breach detected" & "Batch flagged"
        events_written = [
            f"Temperature breach detected ({temp_spike}°C > 4.0°C limit) on transit sensor for batch {target_code}",
            f"Batch {target_code} automatically flagged CRITICAL by Autonomous Cold-Chain Guardian"
        ]

        for idx, msg in enumerate(events_written):
            evt_cypher = """
            CREATE (e:Event {
                id: $evt_id,
                type: $type,
                message: $message,
                ts: $now,
                severity: 'CRITICAL',
                demo: true
            })
            """
            await db.execute_write(evt_cypher, {
                'evt_id': f"EVT_DEMO_{int(time.time()*1000)}_{idx}",
                'type': 'TEMPERATURE_BREACH' if idx == 0 else 'BATCH_FLAGGED',
                'message': msg,
                'now': now_str
            })

        # 4. Fetch impact summary
        impact = await recall_service.get_impact(target_code)

        # 5. Broadcast SSE event
        await event_broadcaster.broadcast("batch_flagged", {
            "batch_code": target_code,
            "status": "CRITICAL",
            "ingredient": impact.ingredient,
            "supplier_name": impact.supplier_name,
            "kitchen_count": impact.kitchen_count,
            "order_count": impact.order_count,
            "customer_count": impact.customer_count,
            "temp_spike": temp_spike,
            "timestamp": now_str,
            "message": f"CRITICAL INCIDENT: Batch {target_code} ({impact.ingredient}) breached cold-chain limits at {temp_spike}°C."
        })

        return SimulateIncidentResponse(
            batch_code=target_code,
            previous_status=prev_status,
            new_status="CRITICAL",
            temp_reading_celsius=temp_spike,
            events_written=events_written,
            impact=impact,
            message=f"Live incident successfully simulated on Batch {target_code}."
        )

    async def reset_demo(self) -> ResetDemoResponse:
        self._ensure_demo_enabled()
        
        # 1. Restore all demo-flagged batches to original status
        restore_batches_cypher = """
        MATCH (b:IngredientBatch {demo: true})
        SET b.status = coalesce(b.original_status, 'NORMAL')
        REMOVE b.demo, b.original_status
        RETURN count(b) AS c
        """
        b_res = await db.execute_write(restore_batches_cypher, {})
        batches_count = b_res[0]['c'] if b_res else 0

        # Also reset PNR-2047 to CRITICAL (its seeded state) and VEG-9182 to MONITORING
        await db.execute_write("MATCH (b:IngredientBatch {code: 'PNR-2047'}) SET b.status = 'CRITICAL' RETURN b", {})
        await db.execute_write("MATCH (b:IngredientBatch {code: 'VEG-9182'}) SET b.status = 'MONITORING' RETURN b", {})
        await db.execute_write("MATCH (b:IngredientBatch {code: 'MILK-774'}) SET b.status = 'RESOLVED' RETURN b", {})

        # 2. Clear demo recalls and tasks
        clear_tasks_cypher = """
        MATCH (t:KitchenTask {demo: true})
        DETACH DELETE t
        RETURN count(t) AS c
        """
        t_res = await db.execute_write(clear_tasks_cypher, {})
        tasks_count = t_res[0]['c'] if t_res else 0

        # Reset task statuses on PNR-2047 back to NOTIFIED for repeat demos
        reset_tasks = """
        MATCH (t:KitchenTask)
        SET t.status = 'NOTIFIED',
            t.updated_by = 'System',
            t.note = 'Batch quarantined. Pending acknowledgement.'
        RETURN count(t) AS c
        """
        await db.execute_write(reset_tasks, {})

        # 3. Clear demo events
        clear_events_cypher = """
        MATCH (e:Event {demo: true})
        DELETE e
        RETURN count(e) AS c
        """
        e_res = await db.execute_write(clear_events_cypher, {})
        events_count = e_res[0]['c'] if e_res else 0

        # 4. Broadcast SSE reset event
        await event_broadcaster.broadcast("demo_reset", {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Demo state successfully reset to original seed baseline."
        })

        return ResetDemoResponse(
            status="RESET_COMPLETE",
            restored_batches_count=batches_count,
            cleared_recalls_count=1,
            cleared_tasks_count=tasks_count,
            cleared_events_count=events_count,
            message="All mock batches, demo tasks, and live events restored to seed state."
        )


demo_service = DemoService()
