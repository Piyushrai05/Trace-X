import pytest
from app.services.investigation_service import run_reverse_investigation
from app.db import db
from app.config import settings

@pytest.mark.asyncio
async def test_reverse_investigation():
    await db.connect(settings)
    try:
        complaints = ["COMP_HERO_0", "COMP_HERO_1", "COMP_HERO_2"]
        res = await run_reverse_investigation(complaints)
        assert len(res.candidates) > 0
        assert res.candidates[0].batch_code == 'PNR-2047'
    finally:
        await db.close()
