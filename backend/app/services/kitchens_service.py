from fastapi import HTTPException
from app.db import db
from app.schemas.kitchens import KitchenSummary, KitchenDetail

async def list_kitchens() -> list[KitchenSummary]:
    query = """
    MATCH (k:Kitchen)
    OPTIONAL MATCH (k)<-[:PREPARED_AT]-(pl:PrepLot)<-[:USED_IN]-(b:IngredientBatch)
    WHERE b.status IN ['MONITORING', 'WARNING', 'CRITICAL']
    RETURN k.id AS id, k.name AS name, k.city AS city, k.lat AS lat, k.lng AS lng, count(DISTINCT b) AS affected_batch_count
    """
    res = await db.execute_read(query, {})
    return [KitchenSummary(**r) for r in res]

async def get_kitchen(kitchen_id: str) -> KitchenDetail:
    query = """
    MATCH (k:Kitchen {id: $id})
    OPTIONAL MATCH (k)<-[:PREPARED_AT]-(pl:PrepLot)<-[:USED_IN]-(b:IngredientBatch)
    WITH k, collect(DISTINCT b) AS batches
    RETURN k, [x IN batches | {code: x.code, ingredient: x.ingredient, status: x.status}] AS inventory
    """
    res = await db.execute_read(query, {'id': kitchen_id})
    if not res:
        raise HTTPException(404, "Not found")
    r = res[0]
    k = r['k']
    inv = r['inventory']
    affected = len([x for x in inv if x['status'] in ['MONITORING', 'WARNING', 'CRITICAL']])
    return KitchenDetail(
        id=k['id'], name=k['name'], city=k['city'], lat=k['lat'], lng=k['lng'],
        active_batch_count=len(inv), affected_batch_count=affected, order_count_today=0, inventory=inv
    )
