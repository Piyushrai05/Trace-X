import pytest
from app.services.demo_service import demo_service
from app.schemas.demo import SimulateIncidentRequest
from app.db import db
from app.config import settings

@pytest.mark.asyncio
async def test_simulate_incident_and_reset():
    await db.connect(settings)
    try:
        # 1. Simulate incident
        req = SimulateIncidentRequest(batch_code="PNR-2047")
        sim_res = await demo_service.simulate_incident(req)
        assert sim_res.batch_code == "PNR-2047"
        assert sim_res.new_status == "CRITICAL"
        assert sim_res.temp_reading_celsius == 14.8
        assert len(sim_res.events_written) == 2

        # 2. Reset demo
        reset_res = await demo_service.reset_demo()
        assert reset_res.status == "RESET_COMPLETE"
    finally:
        await db.close()
