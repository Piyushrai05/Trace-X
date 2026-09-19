import pytest
from fastapi import HTTPException
from app.services.ask_service import ask_graph_service
from app.schemas.ask import AskGraphRequest
from app.db import db
from app.config import settings

def test_ask_guard_rejects_write_keywords():
    # Should reject CREATE, MERGE, DELETE, SET, DROP, etc.
    bad_queries = [
        "MATCH (n) DELETE n",
        "CREATE (b:IngredientBatch {code: 'HACK'})",
        "MATCH (b:IngredientBatch) SET b.status = 'NORMAL'",
        "DROP CONSTRAINT batch_code",
        "CALL apoc.warmup.run()",
        "MERGE (k:Kitchen {id: 'K999'})"
    ]
    for q in bad_queries:
        is_safe, reason = ask_graph_service.validate_safety(q)
        assert is_safe is False
        assert "Forbidden" in reason or "read-only" in reason

def test_ask_guard_enforces_limit():
    cypher = "MATCH (s:Supplier) RETURN s"
    limited = ask_graph_service.enforce_limit(cypher)
    assert "LIMIT 200" in limited

    already_limited = "MATCH (s:Supplier) RETURN s LIMIT 25"
    assert ask_graph_service.enforce_limit(already_limited) == already_limited

@pytest.mark.asyncio
async def test_ask_query_execution():
    await db.connect(settings)
    try:
        req = AskGraphRequest(question="Which suppliers provided batches with CRITICAL status?")
        res = await ask_graph_service.ask(req)
        assert res.cypher != ""
        assert "LIMIT" in res.cypher
        assert res.execution_time_ms >= 0
        assert len(res.rows) >= 0
    finally:
        await db.close()
