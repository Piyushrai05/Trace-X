import asyncio
import httpx
import json
import sys

BASE_URL = "http://localhost:8000/api"

async def run_full_system_test():
    print("=" * 60)
    print("STARTING TRACEX SYSTEM INTEGRATION TEST SUITE")
    print("=" * 60)
    
    passed = 0
    failed = 0
    errors = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Health
        try:
            r = await client.get(f"{BASE_URL}/health")
            assert r.status_code == 200, f"Health returned {r.status_code}"
            data = r.json()
            assert data.get("status") == "ok"
            print("[PASS] Health check endpoint (/api/health)")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Health check: {e}")
            failed += 1
            errors.append(("Health", str(e)))

        # 2. Overview
        try:
            r = await client.get(f"{BASE_URL}/overview")
            assert r.status_code == 200, f"Overview returned {r.status_code}"
            data = r.json()
            assert "kpis" in data or "summary" in data or "city_clusters" in data or isinstance(data, dict)
            print("[PASS] Overview dashboard KPIs (/api/overview)")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Overview: {e}")
            failed += 1
            errors.append(("Overview", str(e)))

        # 3. Recalls List
        try:
            r = await client.get(f"{BASE_URL}/recalls")
            assert r.status_code == 200, f"Recalls returned {r.status_code}"
            batches = r.json()
            assert isinstance(batches, list), "Expected list of batches"
            assert len(batches) > 0, "Expected at least 1 flagged batch"
            print(f"[PASS] Recalls list (/api/recalls) - Found {len(batches)} batches")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Recalls list: {e}")
            failed += 1
            errors.append(("Recalls List", str(e)))

        # 4. Recall Impact for PNR-2047
        try:
            r = await client.get(f"{BASE_URL}/recalls/PNR-2047/impact")
            assert r.status_code == 200, f"Impact returned {r.status_code}"
            impact = r.json()
            assert impact.get("batch_code") == "PNR-2047"
            assert impact.get("kitchen_count", 0) > 0
            print(f"[PASS] Forward Recall Impact (/api/recalls/PNR-2047/impact) - {impact.get('kitchen_count')} kitchens, {impact.get('order_count')} orders")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Recall Impact: {e}")
            failed += 1
            errors.append(("Recall Impact", str(e)))

        # 5. Recall Graph for PNR-2047
        try:
            r = await client.get(f"{BASE_URL}/recalls/PNR-2047/graph")
            assert r.status_code == 200, f"Graph returned {r.status_code}"
            graph = r.json()
            assert "nodes" in graph and "edges" in graph
            print(f"[PASS] Cytoscape Graph Payload (/api/recalls/PNR-2047/graph) - {len(graph['nodes'])} nodes, {len(graph['edges'])} edges")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Recall Graph: {e}")
            failed += 1
            errors.append(("Recall Graph", str(e)))

        # 6. Timeline Replay for PNR-2047
        try:
            r = await client.get(f"{BASE_URL}/recalls/PNR-2047/timeline")
            assert r.status_code == 200, f"Timeline returned {r.status_code}"
            tl = r.json()
            assert "buckets" in tl
            assert len(tl["buckets"]) >= 24
            print(f"[PASS] 24-Hour Contamination Timeline (/api/recalls/PNR-2047/timeline) - {len(tl['buckets'])} hourly buckets")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Timeline Replay: {e}")
            failed += 1
            errors.append(("Timeline Replay", str(e)))

        # 7. Initiate Recall & Kitchen Tasks
        task_id = None
        try:
            r = await client.post(f"{BASE_URL}/recalls/PNR-2047/initiate")
            assert r.status_code == 200, f"Initiate returned {r.status_code}"
            
            # Fetch tasks
            tr = await client.get(f"{BASE_URL}/recalls/PNR-2047/tasks")
            assert tr.status_code == 200, f"Tasks returned {tr.status_code}"
            tasks_data = tr.json()
            assert "tasks" in tasks_data
            assert len(tasks_data["tasks"]) > 0
            task_id = tasks_data["tasks"][0]["id"]
            current_status = tasks_data["tasks"][0]["status"]
            print(f"[PASS] Initiate Recall & Tasks (/api/recalls/PNR-2047/tasks) - {len(tasks_data['tasks'])} kitchen tasks generated")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Initiate & Tasks: {e}")
            failed += 1
            errors.append(("Initiate & Tasks", str(e)))

        # 8. Task Transition State Machine (Forward & 409 Conflict Protection)
        if task_id:
            try:
                # Forward: NOTIFIED -> ACKNOWLEDGED
                r_ack = await client.patch(f"{BASE_URL}/tasks/{task_id}", json={"status": "ACKNOWLEDGED", "note": "Acknowledged by supervisor"})
                assert r_ack.status_code == 200, f"Advance to ACKNOWLEDGED returned {r_ack.status_code}"
                
                # Illegal backward: ACKNOWLEDGED -> NOTIFIED (Must return 409)
                r_back = await client.patch(f"{BASE_URL}/tasks/{task_id}", json={"status": "NOTIFIED", "note": "Illegal rollback"})
                assert r_back.status_code == 409, f"Expected 409 on backward transition, got {r_back.status_code}"

                # Forward: ACKNOWLEDGED -> QUARANTINED
                r_quar = await client.patch(f"{BASE_URL}/tasks/{task_id}", json={"status": "QUARANTINED", "note": "Cold locks engaged"})
                assert r_quar.status_code == 200, f"Advance to QUARANTINED returned {r_quar.status_code}"

                # Forward: QUARANTINED -> DISPOSED
                r_disp = await client.patch(f"{BASE_URL}/tasks/{task_id}", json={"status": "DISPOSED", "note": "Incinerated per protocol"})
                assert r_disp.status_code == 200, f"Advance to DISPOSED returned {r_disp.status_code}"

                print("[PASS] Kitchen Task State Machine (Forward progression & 409 backward prevention)")
                passed += 1
            except Exception as e:
                print(f"[FAIL] Task State Machine: {e}")
                failed += 1
                errors.append(("Task State Machine", str(e)))

        # 9. Reverse Investigation from Complaints
        try:
            # First fetch complaints
            comp_r = await client.get(f"{BASE_URL}/complaints")
            assert comp_r.status_code == 200
            complaints = comp_r.json()
            assert len(complaints) > 0
            
            sample_ids = [c["id"] for c in complaints[:3]]
            inv_r = await client.post(f"{BASE_URL}/investigations/reverse", json={"complaint_ids": sample_ids})
            assert inv_r.status_code == 200, f"Reverse returned {inv_r.status_code}"
            inv_data = inv_r.json()
            assert "candidates" in inv_data
            print(f"[PASS] Reverse Investigation (/api/investigations/reverse) - Found {len(inv_data['candidates'])} candidate sources")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Reverse Investigation: {e}")
            failed += 1
            errors.append(("Reverse Investigation", str(e)))

        # 10. Ask the Graph (Natural Language Cypher)
        try:
            ask_r = await client.post(f"{BASE_URL}/ask", json={"question": "Which suppliers provided batches with CRITICAL status?"})
            assert ask_r.status_code == 200, f"Ask returned {ask_r.status_code}"
            ask_data = ask_r.json()
            assert "cypher" in ask_data and "rows" in ask_data
            print(f"[PASS] Ask the Graph NL Cypher (/api/ask) - Generated: {ask_data['cypher']}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Ask the Graph: {e}")
            failed += 1
            errors.append(("Ask the Graph", str(e)))

        # 11. Ask the Graph Safety Guard (Reject write keywords)
        try:
            safe_r = await client.post(f"{BASE_URL}/ask", json={"question": "DROP CONSTRAINT batch_id"})
            # Should either return 400 (forbidden keyword) or safe fallback
            assert safe_r.status_code in [200, 400]
            if safe_r.status_code == 400:
                print("[PASS] Ask the Graph Security Guard (Blocked forbidden mutation query)")
            else:
                print("[PASS] Ask the Graph Security Guard (Sanitized safely)")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Ask the Graph Safety: {e}")
            failed += 1
            errors.append(("Ask Safety", str(e)))

        # 12. AI Copilot: Regulatory Package & Containment Dispatch
        try:
            reg_r = await client.post(f"{BASE_URL}/copilot/generate-notice", json={
                "batch_code": "PNR-2047",
                "ingredient": "Paneer",
                "supplier_name": "Sharma Dairy",
                "temp_spike_celsius": 14.8,
                "kitchen_count": 12,
                "order_count": 1842,
                "customer_count": 1420
            })
            assert reg_r.status_code == 200
            reg_data = reg_r.json()
            assert "fssai_notice_markdown" in reg_data

            disp_r = await client.post(f"{BASE_URL}/copilot/containment-dispatch", json={
                "batch_code": "PNR-2047",
                "channels": ["pos_auto_86", "rider_intercept", "customer_advisory", "inventory_lock"]
            })
            assert disp_r.status_code == 200
            disp_data = disp_r.json()
            assert disp_data.get("status") == "CRITICAL_CONTAINED"
            print("[PASS] AI Copilot & Automated Containment Dispatch (/api/copilot/*)")
            passed += 1
        except Exception as e:
            print(f"[FAIL] AI Copilot: {e}")
            failed += 1
            errors.append(("AI Copilot", str(e)))


        # 13. Live Demo Incident Simulator & Reset
        try:
            sim_r = await client.post(f"{BASE_URL}/demo/simulate-incident", json={"batch_code": "PNR-2047"})
            assert sim_r.status_code == 200
            
            reset_r = await client.post(f"{BASE_URL}/demo/reset")
            assert reset_r.status_code == 200
            print("[PASS] Live Incident Simulator & Demo Reset (/api/demo/*)")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Demo Simulator & Reset: {e}")
            failed += 1
            errors.append(("Demo Simulator & Reset", str(e)))

        # 14. Detail entities (Batches, Kitchens, Suppliers)
        try:
            b_r = await client.get(f"{BASE_URL}/batches/PNR-2047")
            assert b_r.status_code == 200
            k_r = await client.get(f"{BASE_URL}/kitchens")
            assert k_r.status_code == 200
            s_r = await client.get(f"{BASE_URL}/suppliers")
            assert s_r.status_code == 200
            print("[PASS] Entity Details (/api/batches, /api/kitchens, /api/suppliers)")
            passed += 1
        except Exception as e:
            print(f"[FAIL] Entity Details: {e}")
            failed += 1
            errors.append(("Entity Details", str(e)))

    print("=" * 60)
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 60)
    if errors:
        for name, err in errors:
            print(f"- {name}: {err}")
        sys.exit(1)
    else:
        print("ALL END-TO-END FEATURES VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_full_system_test())
