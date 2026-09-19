from fastapi import HTTPException
from app.db import db
from app.schemas.suppliers import SupplierSummary, SupplierDetail

async def list_suppliers() -> list[SupplierSummary]:
    query = """
    MATCH (s:Supplier)
    OPTIONAL MATCH (s)-[:SUPPLIED]->(b:IngredientBatch)
    RETURN s.id AS id, s.name AS name, s.city AS city, s.category AS category,
           count(b) AS total_batches,
           sum(CASE WHEN b.status IN ['MONITORING', 'WARNING', 'CRITICAL'] THEN 1 ELSE 0 END) AS flagged_batches
    ORDER BY s.id
    """
    res = await db.execute_read(query, {})
    return [SupplierSummary(**r) for r in res]

async def get_supplier(supplier_id: str) -> SupplierDetail:
    query = """
    MATCH (s:Supplier {id: $id})
    OPTIONAL MATCH (s)-[:SUPPLIED]->(b:IngredientBatch)
    WITH s, collect({
        code: b.code,
        ingredient: b.ingredient,
        status: b.status,
        qty_kg: b.qty_kg,
        received_at: b.received_at
    })[0..6] AS recent,
         count(b) AS total,
         sum(CASE WHEN b.status IN ['MONITORING', 'WARNING', 'CRITICAL'] THEN 1 ELSE 0 END) AS flagged
    RETURN s.id AS id, s.name AS name, s.city AS city, s.category AS category,
           total AS total_batches, flagged AS flagged_batches, recent AS recent_batches
    """
    res = await db.execute_read(query, {'id': supplier_id})
    if not res:
        raise HTTPException(404, "Supplier not found")
    return SupplierDetail(**res[0])
