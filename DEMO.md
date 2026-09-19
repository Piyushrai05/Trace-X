# TraceX - Complete Interactive User & Demo Guide

Welcome to **TraceX**! This guide is a step-by-step walkthrough on how to launch, explore, and present every capability of the platform.

---

## Table of Contents
1. [Quick Start (Run the Project)](#quick-start-run-the-project)
2. [Navigation & Interface Layout](#navigation--interface-layout)
3. [Keyboard Shortcuts & Power Features](#keyboard-shortcuts--power-features)
4. [Step-by-Step Feature Walkthrough](#step-by-step-feature-walkthrough)
   - [Feature 1: Live Demo Simulator & SSE Stream](#feature-1-live-demo-simulator--sse-stream)
   - [Feature 2: Forward Recall Blast Radius & Interactive Graph](#feature-2-forward-recall-blast-radius--interactive-graph)
   - [Feature 3: Kitchen Action Tracker (Containment State Machine)](#feature-3-kitchen-action-tracker-containment-state-machine)
   - [Feature 4: 24-Hour Contamination Timeline Replay](#feature-4-24-hour-contamination-timeline-replay)
   - [Feature 5: Ask the Graph (Natural Language Cypher Omnibar)](#feature-5-ask-the-graph-natural-language-cypher-omnibar)
   - [Feature 6: Reverse Root-Cause Investigation](#feature-6-reverse-root-cause-investigation)
   - [Feature 7: AI Copilot & Regulatory Package Generator](#feature-7-ai-copilot--regulatory-package-generator)
5. [Hackathon 3-Minute Presentation Pitch Script](#hackathon-3-minute-presentation-pitch-script)
6. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Quick Start (Run the Project)

To run TraceX locally, open two terminal windows:

### Terminal 1: Backend (FastAPI)
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> API will be live at: **http://localhost:8000** (Swagger docs at **http://localhost:8000/docs**)

### Terminal 2: Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
> Web application will be live at: **http://localhost:5173**

---

## Navigation & Interface Layout

Once you open [http://localhost:5173](http://localhost:5173), you will see the dark-themed command center:

```
+----------------------------------------------------------------------------------------+
| [TraceX Logo]   Overview   Forward Trace   Reverse Investigation    [Ask Graph Ctrl+K]  |
+--------------------------------------+-------------------------------------------------+
|                                      |                                                 |
|   Network KPIs & Active Recalls      |   Interactive Delhi NCR Kitchen Network Map     |
|   - 25 Active Kitchen Hubs           |   - Green/Amber/Red cluster pins                |
|   - 400 Tracked Batches              |   - Clickable kitchen cards with inventory      |
|   - Real-time Health Latency         |                                                 |
|                                      |                                                 |
+--------------------------------------+-------------------------------------------------+
| [DEMO MODE (Shift+D)]                                              (Neo4j Live Status) |
+----------------------------------------------------------------------------------------+
```

---

## Keyboard Shortcuts & Power Features

| Shortcut | Description |
| :--- | :--- |
| Ctrl + K / Cmd + K | **Ask the Graph Omnibar**: Opens natural language query dialog |
| Shift + D | **Live Demo Mode**: Toggles incident simulation & database reset drawer |
| Esc | **Dismiss**: Closes open drawers, modals, and tooltips |

---

## Step-by-Step Feature Walkthrough

### Feature 1: Live Demo Simulator & SSE Stream
**How to use:**
1. Press Shift + D or click the pulsing **"Demo Mode"** badge at the bottom-right.
2. Select target batch (e.g., **`PNR-2047` - Paneer, Sharma Dairy**).
3. Click **"Simulate Outbreak Event"**.
4. **What happens**:
   - The backend fires a temperature spike alert and elevates batch status to `CRITICAL`.
   - The real-time Server-Sent Events (SSE) log streams into the terminal drawer.
   - A floating warning banner notifies you of active contamination in the network.
5. Click **"Reset Demo Data"** whenever you want to restore pristine initial conditions.

---

### Feature 2: Forward Recall Blast Radius & Interactive Graph
**How to use:**
1. Click **"Forward Trace"** in the top navigation bar.
2. Select batch **`PNR-2047`** from the flagged list or type `PNR-2047` into the search bar.
3. Observe the sub-50ms blast radius metrics:
   - **1 Supplier** -> **1 Batch** -> **31 Prep Lots** -> **47 Dishes** -> **12 Kitchen Hubs** -> **1,842 Orders**.
4. **Interact with Cytoscape Canvas**:
   - **Zoom & Pan**: Scroll wheel to zoom, click and drag to pan.
   - **Click Nodes**: Click any Kitchen, Prep Lot, or Dish node to view its ID, timestamp, and metadata in the right-hand inspection drawer.
   - **Expand Nodes**: Click on aggregated Dish clusters to expand individual order lineages.
5. Click **"Initiate Emergency Recall"** to trigger automated task dispatch across all affected kitchens.

---

### Feature 3: Kitchen Action Tracker (Containment State Machine)
**How to use:**
1. On the Forward Trace page, switch to the **"Kitchen Action Tracker"** tab.
2. You will see all 12 affected kitchens categorized into status columns:
   - `NOTIFIED` (Yellow)
   - `ACKNOWLEDGED` (Cyan)
   - `QUARANTINED` (Amber)
   - `DISPOSED` (Green)
3. **Advance individual or all kitchens**:
   - Click **"Acknowledge All"** to confirm kitchens have received the lock signal.
   - Click **"Quarantine All"** to lock refrigerators and prep stations.
   - Click **"Dispose"** on any kitchen -> A bio-secure disposal confirmation modal appears requiring protocol confirmation.
4. Once all 12 kitchen tasks reach `DISPOSED`:
   - The containment progress bar hits **100% CONTAINED**.
   - The global recall status is officially marked **RESOLVED/CONTAINED**.

---

### Feature 4: 24-Hour Contamination Timeline Replay
**How to use:**
1. On the Forward Trace page, switch to the **"Timeline Replay"** tab.
2. Click the **Play** button or drag the slider along the 24-hour scrubber:
   - **T+0h**: Initial batch ingestion at supplier.
   - **T+4h**: Delivery to central preparation centers.
   - **T+8h**: Distribution across 12 Delhi NCR kitchens.
   - **T+16h - T+24h**: Orders served and peak consumer exposure window.
3. Observe how the **Recharts area chart** and **Cytoscape network nodes** dynamically illuminate hour-by-hour.
4. Toggle playback speed between **1x**, **2x**, and **4x**.

---

### Feature 5: Ask the Graph (Natural Language Cypher Omnibar)
**How to use:**
1. Press Ctrl + K (or click **"Ask Graph"** in the top bar).
2. Click any suggested prompt or type your own question:
   - *"Which suppliers provided batches with CRITICAL status?"*
   - *"How many kitchens used batch PNR-2047?"*
   - *"Find top 5 suppliers with most complaints."*
   - *"Show temperature readings for batch PNR-2047."*
3. **What happens**:
   - TraceX translates your English question into an optimized Cypher query.
   - Security guards validate read-only permissions and enforce `LIMIT 200`.
   - Results are presented in an interactive table and a graph visualization mode.
   - Click **"Show Cypher"** to view and copy the raw Cypher query.

---

### Feature 6: Reverse Root-Cause Investigation
**How to use:**
1. Click **"Reverse Investigation"** in the top navigation.
2. Select multiple customer complaints (e.g., complaints citing food poisoning or taste abnormalities).
3. Click **"Find Common Source"**.
4. **What happens**:
   - The graph algorithm traverses upstream from customer orders through dishes, prep lots, and batches.
   - TraceX calculates the intersection point and identifies **`PNR-2047` (Sharma Dairy)** as the single root cause with 100% confidence.

---

### Feature 7: AI Copilot & Regulatory Package Generator
**How to use:**
1. From the Recall Impact page, click **"AI Incident Copilot"**.
2. Click **"Generate FSSAI Regulatory Package"**:
   - Generates an official food safety compliance report complete with batch IDs, timeline timestamps, affected kitchen GPS coordinates, and destruction certifications.
3. Click **"Dispatch Kitchen Containment Broadcast"**:
   - Formats customized SMS/Email operational alerts for kitchen managers.

---

## Hackathon 3-Minute Presentation Pitch Script

| Time | Stage | Action & Key Talking Point |
| :--- | :--- | :--- |
| **0:00 - 0:45** | **The Problem & Outbreak** | Show Overview map. Press Shift + D and simulate outbreak on `PNR-2047`. *"In cloud kitchens, bad ingredients spread to thousands within hours."* |
| **0:45 - 1:30** | **Sub-Second Blast Radius** | Open `PNR-2047` Forward Trace. Show 1,842 orders mapped in 42ms. Click *Initiate Emergency Recall*. |
| **1:30 - 2:15** | **Kitchen Action Tracker** | Switch to *Kitchen Action Tracker*. Walk through `NOTIFIED` -> `QUARANTINED` -> `DISPOSED`. Highlight 100% Contained progress bar. |
| **2:15 - 2:45** | **Timeline Replay** | Press Play on 24h scrubber. Show dynamic graph illumination and exposure window. |
| **2:45 - 3:00** | **Ask the Graph & Closing** | Press Ctrl + K. Ask *"Which suppliers have critical batches?"*. Show real-time Cypher execution. Conclude with reset (Shift + D). |

---

## Troubleshooting & FAQ

#### Q: How does the system work if Neo4j AuraDB credentials are not provided?
> TraceX includes an automatic in-memory mock database engine (`db_mock.py`). All queries, graph traversals, task updates, timeline replays, and natural language questions will continue to work seamlessly out-of-the-box.

#### Q: The keyboard shortcuts (Shift+D, Ctrl+K) are not opening?
> Make sure your cursor is focused within the browser window. Alternatively, you can click the **"Ask Graph (Ctrl+K)"** button in the top navigation or the **"Demo Mode"** badge at the bottom-right.

#### Q: Port 8000 or 5173 is already in use?
> You can launch the backend on a different port: `python -m uvicorn app.main:app --port 8001`. If you change the backend port, update `VITE_API_URL=http://localhost:8001` in `frontend/.env`.
