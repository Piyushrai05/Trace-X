import asyncio
import logging
from typing import Any, Optional

from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncManagedTransaction
from neo4j.exceptions import TransientError
from app.db_mock import mock_store

logger = logging.getLogger("tracex.db")


class Neo4jDB:
    def __init__(self) -> None:
        self._driver: Optional[AsyncDriver] = None
        self._connected: bool = False

    async def connect(self, settings: Any) -> None:
        if not settings.neo4j_uri:
            logger.info(
                "NEO4J_URI not set — initializing TraceX in simulated in-memory store mode. "
                "Configure .env with Neo4j Aura credentials to connect directly."
            )
            return
        try:
            self._driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_username, settings.neo4j_password),
            )
            await self._driver.verify_connectivity()
            self._connected = True
            logger.info("Neo4j AuraDB connected ✓")
        except Exception as exc:
            logger.error(f"Neo4j connection failed: {exc}. Falling back to in-memory store.")
            self._driver = None
            self._connected = False

    async def close(self) -> None:
        if self._driver is not None:
            await self._driver.close()
            self._driver = None
            self._connected = False

    @property
    def connected(self) -> bool:
        return self._connected

    async def execute_read(self, query: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        if self._driver is None or not self._connected:
            return mock_store.execute_read(query, params)

        async def _tx(tx: AsyncManagedTransaction) -> list[dict[str, Any]]:
            result = await tx.run(query, **params)
            return await result.data()

        delays = [0.1, 0.2, 0.4]
        for attempt, delay in enumerate(delays):
            try:
                async with self._driver.session() as session:
                    return await session.execute_read(_tx)
            except TransientError:
                if attempt < len(delays) - 1:
                    await asyncio.sleep(delay)
                else:
                    raise
            except Exception as e:
                logger.warning(f"Neo4j query error: {e}. Falling back to in-memory store.")
                return mock_store.execute_read(query, params)
        return []

    async def execute_write(self, query: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        if self._driver is None or not self._connected:
            return mock_store.execute_write(query, params)

        async def _tx(tx: AsyncManagedTransaction) -> list[dict[str, Any]]:
            result = await tx.run(query, **params)
            return await result.data()

        delays = [0.1, 0.2, 0.4]
        for attempt, delay in enumerate(delays):
            try:
                async with self._driver.session() as session:
                    return await session.execute_write(_tx)
            except TransientError:
                if attempt < len(delays) - 1:
                    await asyncio.sleep(delay)
                else:
                    raise
            except Exception as e:
                logger.warning(f"Neo4j write error: {e}. Falling back to in-memory store.")
                return mock_store.execute_write(query, params)
        return []


db = Neo4jDB()
