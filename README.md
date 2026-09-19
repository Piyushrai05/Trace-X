# TraceX - Food Supply Chain Recall Intelligence

**Food supply chain recall intelligence, built on a Neo4j Aura graph.**

TraceX connects every step of the food supply chain: supplier, ingredient batch, prep lot, dish, order, and customer. It helps teams find and stop contaminated food fast.

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-teal?logo=fastapi)](https://fastapi.tiangolo.com)
[![Neo4j](https://img.shields.io/badge/Neo4j-AuraDB%205.x-008CC1?logo=neo4j)](https://neo4j.com)
[![React](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Cytoscape.js](https://img.shields.io/badge/Cytoscape.js-Graph%20Engine-ea580c)](https://js.cytoscape.org/)

Repository: [https://github.com/Piyushrai05/Trace-X.git](https://github.com/Piyushrai05/Trace-X.git)

---

## What It Does

- **Forward recall trace:** Pick a flagged batch and see every kitchen, dish, and order it reached in sub-second time.
- **Reverse investigation:** Start from customer complaints and find the most likely common upstream source.
- **Graph explorer:** Click any node to see its exact path and metadata through the supply chain.
- **Kitchen action tracker:** 4-stage operational quarantine state machine (`NOTIFIED` -> `ACKNOWLEDGED` -> `QUARANTINED` -> `DISPOSED`) with audit logging.
- **Contamination timeline replay:** 24-hour chronological scrubber with live Cytoscape graph highlighting and Recharts cumulative area metrics.
- **Ask the Graph:** Natural language question-to-Cypher engine with strict read-only safety validation and `LIMIT 200` enforcement.

---

## Tech Stack & Architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Leaflet, Recharts
- **Backend:** FastAPI (Python 3.11+), Async Neo4j Python Driver, Groq LLM Inference (Llama 3.3 70B)
- **Database:** Neo4j AuraDB (or automatic zero-config in-memory mock fallback)

The browser never talks to Neo4j directly. All queries go through the FastAPI backend.

```
+--------------------------------+     REST / SSE      +-----------------------------+     Bolt / TLS     +----------------------------+
|  React 18 + Vite (TypeScript)  | ------------------> |  FastAPI (Python 3.11+)     | -----------------> |  Neo4j AuraDB / Mock DB    |
|  - Tailwind CSS                | <------------------ |  - Recall & Task Engine     | <----------------- |  - Parameterized Cypher    |
|  - Cytoscape.js & Leaflet      |   (EventSource /    |  - Natural Language Cypher  |                    |  - Unique Constraints      |
|  - Recharts Timeline Scrubber  |    JSON APIs)       |  - SSE Broadcast Stream     |                    |  - <40k Nodes Budget       |
+--------------------------------+                     +-----------------------------+                    +----------------------------+
      http://localhost:5173                                  http://localhost:8000
```

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- A Neo4j Aura instance (the free tier works) or automatic in-memory fallback

### 2. Clone
```bash
git clone https://github.com/Piyushrai05/Trace-X.git
cd Trace-X
```

### 3. Configure
```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in your Aura details:
```ini
NEO4J_URI=neo4j+s://<instance-id>.databases.neo4j.io
NEO4J_USERNAME=<from your Aura credentials file>
NEO4J_PASSWORD=<from your Aura credentials file>
NEO4J_DATABASE=<your database name, shown in the Aura console>
FRONTEND_ORIGIN=http://localhost:5173

# Optional: Groq LLM API Key for natural language "Ask the Graph"
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Never commit `.env`.

### 4. Load the Data

In the Aura console, open **Query** and run `scripts/init_schema.cypher`. Then:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/seed.py --reset
```

The data is fictional and sized to fit Aura Free (<40,000 nodes, <120,000 relationships).

### 5. Run the Backend

```bash
uvicorn app.main:app --reload --port 8000
```

Check it at http://localhost:8000/api/health. It should say `connected`.

### 6. Run the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173.

---

## Try the Demo

1. Open **Overview** and click **Trace impact** on the active recall (`PNR-2047`).
2. Click a kitchen and a customer in the graph to see their exact path.
3. Open **Reverse Investigation**, select complaints, and click **Find common source**.
4. Press **Shift + D** to open the **Live Incident Simulator** and simulate cold-chain temperature breaches with SSE live streaming.
5. Press **Ctrl + K** to open **Ask the Graph** and ask questions in plain English.

---

## Explore the Data in Neo4j (Query and Bloom)

After seeding, you can look at the graph directly in the Aura console.

- **Query tab:** Run Cypher and switch between table and graph views. Queries that `RETURN path` show as an interactive graph.
- **Bloom tab:** A visual explorer. Use the search bar to pick a pattern (for example Order, Dish, PrepLot), expand nodes by double-clicking, and change colors and captions. It is a good backup view during a demo.

### Data Model

Every dish is a specific cooked unit linked to the prep lot it came from, so a trace never flags unrelated orders.

```cypher
(:Order)-[:CONTAINS_DISH]->(:Dish)-[:FROM_PREP_LOT]->(:PrepLot)
(:Order)-[:PLACED_BY]->(:Customer)
(:Supplier)-[:SUPPLIED]->(:IngredientBatch)-[:USED_IN]->(:PrepLot)
(:Recall)-[:HAS_TASK]->(:KitchenTask)-[:FOR_KITCHEN]->(:Kitchen)
```

All data is fictional.

### Useful Cypher Queries

**1. See orders, their dishes, and the prep lots behind them**
```cypher
MATCH path = (o:Order)-[:CONTAINS_DISH]->(d:Dish)-[:FROM_PREP_LOT]->(p:PrepLot)
RETURN path
LIMIT 25
```

**2. List every node label with its properties and types**
```cypher
CALL db.schema.nodeTypeProperties()
YIELD nodeLabels, propertyName, propertyTypes
RETURN nodeLabels, propertyName, propertyTypes
ORDER BY nodeLabels, propertyName
```

**3. See customers, their orders, and the dishes in them**
```cypher
MATCH path = (c:Customer)<-[:PLACED_BY]-(o:Order)-[:CONTAINS_DISH]->(d:Dish)
RETURN path
LIMIT 10
```

**4. Trace hero batch PNR-2047 blast radius**
```cypher
MATCH path = (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: 'PNR-2047'})-[:USED_IN]->(pl:PrepLot)-[:MADE_INTO]->(d:Dish)-[:SOLD_IN]->(o:Order)
RETURN path
LIMIT 50
```

Keep `LIMIT` small when drawing paths. Large results are slow to render and can crowd the graph view.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| Ctrl + K / Cmd + K | Open **Ask Graph** AI natural language query omnibar |
| Shift + D | Toggle **Live Demo Mode** incident simulator and reset drawer |
| Esc | Close open modals, drawers, or command palettes |

---

## Testing & Verification

Run the comprehensive backend test suite:
```bash
cd backend
pytest -v
```

**Test Coverage (10/10 Passing):**
- `test_ask_guard_rejects_write_keywords` & `test_ask_guard_enforces_limit` (Cypher safety verification)
- `test_ask_query_execution` (Natural language graph execution)
- `test_task_status_forward_transition_rules` (409 conflict and forward state validation)
- `test_initiate_recall_workflow_idempotency` (Idempotent task initialization)
- `test_simulate_incident_and_reset` (Demo mode simulation and state reset)
- `test_hero_impact` & `test_reverse_investigation` (Graph traversal blast radius)
- `test_generate_regulatory_package` & `test_dispatch_emergency_containment` (Regulatory copilot)

Frontend TypeScript build verification:
```bash
cd frontend
npm run build
```

---

## API Reference

### Health & Overview
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Neo4j connectivity and latency check |
| `GET` | `/api/overview` | Active recall stats, network KPIs, Delhi NCR geo markers |

### Recalls & Graph
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/recalls` | List flagged ingredient batches |
| `GET` | `/api/recalls/{code}/impact` | Sub-second blast radius summary |
| `GET` | `/api/recalls/{code}/graph` | Cytoscape graph payload |
| `POST` | `/api/recalls/{code}/initiate` | Lock batch, create recall, generate kitchen tasks |
| `GET` | `/api/recalls/{code}/timeline` | 24-hour chronological exposure replay data |

### Kitchen Tasks & Containment
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/recalls/{code}/tasks` | Per-kitchen task list & % containment progress |
| `PATCH` | `/api/tasks/{id}` | Advance task state (`ACKNOWLEDGED` -> `QUARANTINED` -> `DISPOSED`) |

### Natural Language & Live Demo
| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ask` | Natural language question to validated Cypher query |
| `GET` | `/api/stream` | Server-Sent Events (SSE) live alert stream |
| `POST` | `/api/demo/simulate-incident` | Simulate live temperature spike / contamination |
| `POST` | `/api/demo/reset` | Reset database to initial seed state |

---

## Notes

- Aura Free pauses after a few days of inactivity. Resume it in the Aura console before running.
- All data is fictional. Notifications are simulated.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
