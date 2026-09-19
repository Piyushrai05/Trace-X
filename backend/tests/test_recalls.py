import pytest
from app.services.recall_service import get_impact
from app.db import db
from app.config import settings

@pytest.mark.asyncio
async def test_hero_impact():
    await db.connect(settings)
    try:
        impact = await get_impact('PNR-2047')
        assert impact.kitchen_count >= 10
        assert impact.prep_lot_count >= 25
        assert impact.dish_count >= 40
        assert impact.order_count >= 1000
        assert impact.customer_count >= 1000
    finally:
        await db.close()
