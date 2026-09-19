from fastapi import APIRouter, Query
from app.schemas.complaints import ComplaintItem
from app.db import db

router = APIRouter()

@router.get('/complaints', response_model=list[ComplaintItem])
async def list_complaints(q: str = Query('')):
    query = """
    MATCH (c:Complaint)
    WHERE toLower(c.text) CONTAINS toLower($q) OR $q = ''
    RETURN c.id AS id, c.text AS text, c.created_at AS created_at, c.severity AS severity,
    [(c)-[:ABOUT]->(o) | o.id][0] AS order_id
    LIMIT 50
    """
    res = await db.execute_read(query, {'q': q})
    return [ComplaintItem(**r) for r in res]
