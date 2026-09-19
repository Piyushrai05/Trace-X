from fastapi import APIRouter
from app.services.carto_service import carto_service

router = APIRouter()


@router.get("/carto/status")
async def get_carto_status() -> dict:
    return await carto_service.get_status()


@router.post("/carto/query")
async def query_carto_sql(payload: dict) -> dict:
    q = payload.get("query", "SELECT 1")
    return await carto_service.execute_spatial_sql(q)
