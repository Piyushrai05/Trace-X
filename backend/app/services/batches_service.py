from fastapi import HTTPException
from app.db import db
from app.schemas.batches import BatchDetail, TempReading

async def get_batch_detail(code: str) -> BatchDetail:
    query = """
    MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: $code})
    OPTIONAL MATCH (b)-[:HAS_TEMP]->(t:TempReading)
    RETURN b, s, collect(t ORDER BY t.ts) AS temps
    """
    res = await db.execute_read(query, {'code': code})
    if not res:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    r = res[0]
    b = r['b']
    s = r['s']
    temps = [TempReading(**t) for t in r['temps'] if t]
    
    return BatchDetail(
        code=b['code'], ingredient=b['ingredient'], status=b['status'],
        supplier_name=s['name'], supplier_id=s['id'],
        qty_kg=b['qty_kg'], received_at=b['received_at'], expiry=b['expiry'],
        temp_readings=temps
    )
