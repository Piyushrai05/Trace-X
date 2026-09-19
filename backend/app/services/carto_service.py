import time
import httpx
from typing import Any
from app.config import settings


class CartoSpatialService:
    def __init__(self) -> None:
        self.base_url = settings.carto_api_base.rstrip("/")
        self.token = settings.carto_access_token
        self.connection = settings.carto_connection

    async def get_status(self) -> dict[str, Any]:
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/v3/version")
                latency = round((time.monotonic() - start) * 1000, 2)
                return {
                    "status": "connected" if res.status_code < 500 else "degraded",
                    "region": "gcp-asia-northeast1",
                    "api_base": self.base_url,
                    "has_token": bool(self.token),
                    "latency_ms": latency,
                }
        except Exception as e:
            return {
                "status": "offline_fallback",
                "region": "gcp-asia-northeast1",
                "api_base": self.base_url,
                "has_token": bool(self.token),
                "detail": str(e),
            }

    async def execute_spatial_sql(self, query: str) -> dict[str, Any]:
        if not self.token:
            return {
                "error": "CARTO_ACCESS_TOKEN is not set in backend/.env",
                "hint": "Provide your CARTO token to query CARTO Data Warehouse live.",
                "rows": [],
            }

        url = f"{self.base_url}/v3/sql/{self.connection}/query"
        headers = {"Authorization": f"Bearer {self.token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, params={"q": query}, headers=headers)
            if res.status_code != 200:
                return {"error": f"CARTO API returned {res.status_code}", "detail": res.text, "rows": []}
            return res.json()


carto_service = CartoSpatialService()
