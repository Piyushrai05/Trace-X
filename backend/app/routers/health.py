import time
import logging

from fastapi import APIRouter
from app.db import db

router = APIRouter()
logger = logging.getLogger("tracex.health")


@router.get("/health")
async def health_check() -> dict:
    start = time.monotonic()
    await db.execute_read("RETURN 1 AS ok", {})
    elapsed = round((time.monotonic() - start) * 1000, 2)
    
    if db.connected:
        return {
            "status": "ok",
            "neo4j": "connected",
            "mode": "auradb",
            "latency_ms": elapsed,
        }
    else:
        return {
            "status": "ok",
            "neo4j": "simulated_store",
            "mode": "in_memory_graph",
            "latency_ms": elapsed,
            "hint": "Running in simulated graph mode. To connect hosted Neo4j AuraDB, provide credentials in backend/.env.",
        }
