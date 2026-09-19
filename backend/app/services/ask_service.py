import re
import time
import json
from typing import Any
import httpx
from fastapi import HTTPException
from app.config import settings
from app.db import db
from app.schemas.ask import AskGraphRequest, AskGraphResponse
from app.schemas.recalls import GraphPayload, GraphNode, GraphEdge

FORBIDDEN_KEYWORDS = {
    'CREATE', 'MERGE', 'DELETE', 'SET', 'REMOVE',
    'DROP', 'CALL', 'LOAD', 'FOREACH', 'DETACH', 'ALTER'
}

GRAPH_SCHEMA_PROMPT = """
You are a Neo4j Cypher generator for TraceX, a food supply chain traceability platform.
Return JSON ONLY: {"cypher": "<query>", "explanation": "<short natural language summary>"}

SCHEMA:
Nodes:
- (s:Supplier {id, name, city, category})
- (b:IngredientBatch {id, code, ingredient, qty_kg, received_at, expiry, status}) [status: NORMAL, MONITORING, WARNING, CRITICAL, RESOLVED]
- (pl:PrepLot {id, batch_id})
- (k:Kitchen {id, name, city, lat, lng})
- (d:Dish {id, name, price})
- (o:Order {id, placed_at, total_amount})
- (c:Customer {id, name, phone, city})
- (comp:Complaint {id, text, severity, created_at})
- (r:Recall {id, batch_code, status, initiated_at})
- (t:KitchenTask {id, status, updated_at})

Relationships:
- (s)-[:SUPPLIED]->(b)
- (b)-[:USED_IN]->(pl)
- (pl)-[:PREPARED_AT]->(k)
- (pl)-[:MADE_INTO]->(d)
- (d)-[:SOLD_IN]->(o)
- (o)-[:PLACED_BY]->(c)
- (comp)-[:ABOUT]->(o)
- (r)-[:FOR_BATCH]->(b)
- (r)-[:HAS_TASK]->(t)
- (t)-[:FOR_KITCHEN]->(k)

EXAMPLES:
Q: Which suppliers provided batches with CRITICAL status?
Cypher: MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {status: 'CRITICAL'}) RETURN s.name AS supplier, b.code AS batch, b.ingredient AS ingredient LIMIT 50

Q: How many kitchens used batch PNR-2047?
Cypher: MATCH (b:IngredientBatch {code: 'PNR-2047'})-[:USED_IN]->(pl:PrepLot)-[:PREPARED_AT]->(k:Kitchen) RETURN count(DISTINCT k) AS affected_kitchen_count

Q: Find top 5 suppliers with most complaints.
Cypher: MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch)-[:USED_IN]->(pl:PrepLot)-[:MADE_INTO]->(d:Dish)-[:SOLD_IN]->(o:Order)<-[:ABOUT]-(comp:Complaint) RETURN s.name AS supplier, count(comp) AS complaint_count ORDER BY complaint_count DESC LIMIT 5

Q: Show temperature readings for batch PNR-2047.
Cypher: MATCH (b:IngredientBatch {code: 'PNR-2047'})-[:HAS_TEMP]->(t:TempReading) RETURN t.ts AS timestamp, t.celsius AS temperature ORDER BY t.ts ASC LIMIT 50
"""

class AskGraphService:
    def validate_safety(self, cypher: str) -> tuple[bool, str]:
        # Split tokens by non-alphanumeric/underscore
        tokens = set(re.findall(r'\b[A-Za-z_]+\b', cypher.upper()))
        found_forbidden = tokens.intersection(FORBIDDEN_KEYWORDS)
        if found_forbidden:
            return False, f"Forbidden modification keyword(s) detected: {', '.join(sorted(found_forbidden))}. Ask the Graph is strictly read-only."
        
        # Enforce MATCH or RETURN
        if not re.search(r'\b(MATCH|RETURN|WITH)\b', cypher, re.IGNORECASE):
            return False, "Query must contain a valid read statement (MATCH / RETURN)."

        return True, ""

    def enforce_limit(self, cypher: str) -> str:
        trimmed = cypher.strip().rstrip(';')
        if not re.search(r'\bLIMIT\s+\d+', trimmed, re.IGNORECASE):
            trimmed += " LIMIT 200"
        return trimmed

    def _fallback_generate(self, question: str) -> tuple[str, str]:
        q_lower = question.lower()
        if "critical" in q_lower or "flagged" in q_lower or "recall" in q_lower:
            return (
                "MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch) WHERE b.status IN ['CRITICAL', 'WARNING', 'MONITORING'] RETURN b.code AS batch_code, b.ingredient AS ingredient, b.status AS status, s.name AS supplier, b.qty_kg AS qty_kg LIMIT 50",
                "Here are the active high-priority and critical ingredient batches along with their upstream suppliers."
            )
        elif "pnr-2047" in q_lower or "pnr2047" in q_lower or "paneer" in q_lower:
            return (
                "MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: 'PNR-2047'})-[:USED_IN]->(pl:PrepLot)-[:PREPARED_AT]->(k:Kitchen) RETURN b.code AS batch, b.ingredient AS ingredient, k.name AS kitchen, k.city AS city LIMIT 50",
                "Detailed downstream distribution trace for hero Paneer batch PNR-2047."
            )
        elif "complaint" in q_lower or "poison" in q_lower or "sick" in q_lower:
            return (
                "MATCH (c:Complaint)-[:ABOUT]->(o:Order) RETURN c.id AS complaint_id, c.severity AS severity, c.text AS complaint_text, o.id AS order_id, c.created_at AS date LIMIT 50",
                "Recent consumer health and quality complaints recorded in the network."
            )
        elif "kitchen" in q_lower or "hub" in q_lower:
            return (
                "MATCH (k:Kitchen) RETURN k.id AS kitchen_id, k.name AS name, k.city AS city, k.lat AS lat, k.lng AS lng ORDER BY k.city LIMIT 50",
                "List of all regional cloud-kitchen hubs across Delhi NCR."
            )
        elif "supplier" in q_lower or "vendor" in q_lower:
            return (
                "MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch) RETURN s.name AS supplier, s.city AS city, s.category AS category, count(b) AS total_batches ORDER BY total_batches DESC LIMIT 20",
                "Upstream supplier catalogue and batch fulfillment volumes."
            )
        else:
            return (
                "MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch) RETURN s.name AS supplier, b.code AS batch_code, b.ingredient AS ingredient, b.status AS status LIMIT 25",
                "Top supply chain batches and supplier links across the network."
            )

    async def generate_cypher(self, question: str) -> tuple[str, str]:
        # 1. Try Groq API (Ultra-fast LLM inference)
        if settings.groq_api_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.groq_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": settings.groq_model,
                            "messages": [
                                {"role": "system", "content": GRAPH_SCHEMA_PROMPT},
                                {"role": "user", "content": question}
                            ],
                            "temperature": 0.1,
                            "max_tokens": 500,
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if resp.status_code == 200:
                        content_str = resp.json()["choices"][0]["message"]["content"]
                        json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
                        if json_match:
                            parsed = json.loads(json_match.group(0))
                            cypher = parsed.get("cypher", "")
                            explanation = parsed.get("explanation", "")
                            if cypher:
                                return cypher, explanation
            except Exception as e:
                print(f"[AskGraph] Groq API fallback: {e}")

        # 2. Try Anthropic API
        if settings.anthropic_api_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": settings.anthropic_api_key,
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json",
                        },
                        json={
                            "model": settings.anthropic_model,
                            "max_tokens": 400,
                            "system": GRAPH_SCHEMA_PROMPT,
                            "messages": [{"role": "user", "content": question}],
                        }
                    )
                    if resp.status_code == 200:
                        text = resp.json()['content'][0]['text']
                        # Parse JSON
                        json_match = re.search(r'\{.*\}', text, re.DOTALL)
                        if json_match:
                            parsed = json.loads(json_match.group(0))
                            return parsed.get("cypher", ""), parsed.get("explanation", "")
            except Exception as e:
                print(f"[AskGraph] Anthropic API fallback: {e}")

        # 3. Fallback to deterministic generator
        return self._fallback_generate(question)

    async def ask(self, req: AskGraphRequest) -> AskGraphResponse:
        start_time = time.monotonic()
        question = req.question.strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        # 1. Generate Cypher
        cypher, explanation = await self.generate_cypher(question)
        if not cypher:
            raise HTTPException(status_code=422, detail="Could not generate Cypher for this question.")

        # 2. Safety Validation (Mandatory check)
        is_safe, reason = self.validate_safety(cypher)
        if not is_safe:
            raise HTTPException(status_code=400, detail=reason)

        # 3. Enforce Limit
        safe_cypher = self.enforce_limit(cypher)

        # 4. Execute in read session
        try:
            raw_res = await db.execute_read(safe_cypher, {})
        except Exception as err:
            raise HTTPException(status_code=400, detail=f"Query execution error: {str(err)}")

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 2)

        # Normalize results
        rows = raw_res if isinstance(raw_res, list) else []
        columns = list(rows[0].keys()) if rows else []

        # Optional graph extraction if nodes present in response
        graph_nodes = []
        graph_edges = []
        for r in rows:
            for k, val in r.items():
                if isinstance(val, dict) and 'id' in val:
                    graph_nodes.append(GraphNode(
                        id=str(val['id']),
                        type=val.get('type', 'dish'),
                        label=val.get('name', val.get('code', str(val['id']))),
                        data=val
                    ))

        graph_payload = None
        if graph_nodes:
            graph_payload = GraphPayload(
                nodes=graph_nodes[:50],
                edges=graph_edges[:50],
                meta={'node_count': len(graph_nodes)}
            )

        return AskGraphResponse(
            question=question,
            answer_summary=explanation or f"Executed query returned {len(rows)} record(s).",
            cypher=safe_cypher,
            columns=columns,
            rows=rows[:200],
            row_count=len(rows),
            graph=graph_payload,
            execution_time_ms=elapsed_ms
        )

ask_graph_service = AskGraphService()
