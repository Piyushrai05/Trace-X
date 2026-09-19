# TraceX - Food Supply Chain Traceability & Rapid Incident Containment Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-teal?logo=fastapi)](https://fastapi.tiangolo.com)
[![Neo4j](https://img.shields.io/badge/Neo4j-AuraDB%205.x-008CC1?logo=neo4j)](https://neo4j.com)
[![React](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Cytoscape.js](https://img.shields.io/badge/Cytoscape.js-Graph%20Engine-ea580c)](https://js.cytoscape.org/)

**TraceX** is an enterprise-grade food supply chain traceability and rapid incident containment platform built for cloud-kitchen networks. It enables sub-second blast-radius calculation, automated multi-kitchen recall orchestration, chronological contamination timeline replaying, and natural language graph querying over Neo4j.

---

```
Supply Chain Graph Flow:
Supplier -> IngredientBatch -> PrepLot -> Dish -> Order -> Customer
                                  |                 ^
                                  v                 |
                               Kitchen -------------+
                                  ^
                                  |
                             KitchenTask (NOTIFIED -> ACKNOWLEDGED -> QUARANTINED -> DISPOSED)
```

---

## Key Platform Features

### 1. Sub-Second Forward Recall Blast Radius
- **Hop-by-Hop Recursive Graph Traversal**: Instantly trace a contaminated batch (`PNR-2047`) across suppliers, prep lots, dishes, cloud kitchens, and end-customer orders with sub-50ms query latency.
- **Interactive Cytoscape.js Canvas**: Node grouping, multi-hop edge tracing, cluster inspection, and live node expansion.

### 2. Kitchen Action Tracker (Containment State Machine)
- **4-Stage Quarantine Protocol**: Enforces immutable forward progression: `NOTIFIED` -> `ACKNOWLEDGED` -> `QUARANTINED` -> `DISPOSED`.
- **409 Conflict Invariant**: Prevents illegal backward state jumps or duplicate task creation.
- **Automatic Containment Resolution**: Dynamically transitions the entire recall status to `CONTAINED` once all kitchen tasks reach `DISPOSED`.

### 3. 24-Hour Contamination Timeline Replay
- **Chronological Propagation Scrubber**: Play, pause, and scrub through 24 hourly time buckets with 1x, 2x, and 4x speed controls.
- **Synchronous Visuals**: Dual-mode rendering with a Recharts cumulative exposure area chart and live Cytoscape graph node highlighting.

### 4. Ask the Graph (Natural Language Cypher Engine)
- **AI-Powered Cypher Generation**: Ask complex supply chain questions in plain English (e.g., *"Which suppliers delivered critical batches?"*, *"Find top 5 suppliers with most complaints"*).
- **Strict Read-Only Security Guard**: Tokenized Cypher parsing that validates read-only constraints and strictly rejects mutation keywords (`CREATE`, `DELETE`, `MERGE`, `DROP`, `SET`, `REMOVE`, `CALL`). Enforces strict `LIMIT 200`.

### 5. Reverse Investigation (Root-Cause Analysis)
- **Upstream Graph Intersection**: Pinpoint common contaminated batches and suppliers starting from isolated customer complaints.

### 6. Live Demo Mode & Incident Simulator (SSE)
- **Real-Time Event Broadcasting**: Server-Sent Events (`/api/stream`) broadcasting live temperature breaches and contamination alerts.
- **Instant Demo Reset**: Single-click pristine seed state restoration.

---

## Architecture

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

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| Ctrl + K / Cmd + K | Open **Ask Graph** AI natural language query omnibar |
| Shift + D | Toggle **Live Demo Mode** incident simulator and reset drawer |
| Esc | Close open modals, drawers, or command palettes |

---

## Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Neo4j AuraDB instance (console.neo4j.io) or automatic zero-config in-memory mock fallback

---

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env` with your Neo4j credentials:
```ini
NEO4J_URI=neo4j+s://<your-aura-instance>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<your-password>
NEO4J_DATABASE=neo4j
FRONTEND_ORIGIN=http://localhost:5173
```

*(Optional) Seed the graph database:*
```bash
python scripts/seed.py
```

Run the backend server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Swagger Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

- **Frontend Dashboard**: http://localhost:5173

---

## Testing & Verification

Run the backend test suite:
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

Frontend TypeScript and build check:
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

## Graph Schema

```cypher
(:Supplier)-[:SUPPLIED]->(:IngredientBatch)-[:USED_IN]->(:PrepLot)-[:MADE_INTO]->(:Dish)-[:SOLD_IN]->(:Order)-[:PLACED_BY]->(:Customer)
                               |                               |
                               v                               v
                      (:TempReading)                     (:Kitchen)
                                                               ^
                                                               |
                               (:Recall)-[:HAS_TASK]->(:KitchenTask)
```

---

## Hackathon Demo Guide

For a step-by-step 3-minute pitch script with judging scenarios, please refer to [DEMO.md](./DEMO.md).
