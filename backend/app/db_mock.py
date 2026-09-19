import random
from typing import Any, Optional


class MockGraphStore:
    def __init__(self) -> None:
        random.seed(42)
        self.suppliers = [
            {'id': 'S001', 'name': 'Supplier A (Sharma Dairy)', 'city': 'Delhi', 'category': 'Dairy'},
            {'id': 'S002', 'name': 'Green Fields Veggies', 'city': 'Sonipat', 'category': 'Vegetables'},
            {'id': 'S003', 'name': 'Punjab Grain House', 'city': 'Ludhiana', 'category': 'Grains'},
            {'id': 'S004', 'name': 'Rajasthan Spice Co', 'city': 'Jaipur', 'category': 'Spices'},
            {'id': 'S005', 'name': 'Himalayan Organics', 'city': 'Dehradun', 'category': 'Organic'},
            {'id': 'S006', 'name': 'Delhi Poultry Farm', 'city': 'Gurgaon', 'category': 'Poultry'},
            {'id': 'S007', 'name': 'UP Meat Traders', 'city': 'Agra', 'category': 'Meat'},
            {'id': 'S008', 'name': 'Noida Fresh Farms', 'city': 'Noida', 'category': 'Vegetables'},
            {'id': 'S009', 'name': 'Haryana Wheat Mill', 'city': 'Rohtak', 'category': 'Grains'},
            {'id': 'S010', 'name': 'South India Spice Co', 'city': 'Chennai', 'category': 'Spices'},
            {'id': 'S011', 'name': 'Amul Distributor Delhi', 'city': 'Delhi', 'category': 'Dairy'},
            {'id': 'S012', 'name': 'Fresh Catch Seafood', 'city': 'Mumbai', 'category': 'Seafood'},
        ]

        cities = [
            ('Delhi', 28.6139, 77.2090),
            ('Gurugram', 28.4595, 77.0266),
            ('Noida', 28.5355, 77.3910),
            ('Ghaziabad', 28.6692, 77.4538),
            ('Faridabad', 28.4089, 77.3178),
        ]
        self.kitchens = []
        for i in range(25):
            c, lat, lng = cities[i % 5]
            self.kitchens.append({
                'id': f'K{i+1:03d}',
                'name': f'Kitchen Hub {i+1} ({c})',
                'city': c,
                'lat': lat + random.uniform(-0.03, 0.03),
                'lng': lng + random.uniform(-0.03, 0.03),
            })

        self.batches = {
            'PNR-2047': {
                'id': 'B_PNR2047',
                'code': 'PNR-2047',
                'ingredient': 'Paneer',
                'qty_kg': 420.0,
                'received_at': '2026-09-18T06:00:00',
                'expiry': '2026-09-25T00:00:00',
                'status': 'CRITICAL',
                'supplier_id': 'S001',
            },
            'VEG-9182': {
                'id': 'B_VEG9182',
                'code': 'VEG-9182',
                'ingredient': 'Spinach',
                'qty_kg': 180.0,
                'received_at': '2026-09-17T08:00:00',
                'expiry': '2026-09-22T00:00:00',
                'status': 'MONITORING',
                'supplier_id': 'S002',
            },
            'MILK-774': {
                'id': 'B_MILK774',
                'code': 'MILK-774',
                'ingredient': 'Full Cream Milk',
                'qty_kg': 600.0,
                'received_at': '2026-09-15T07:00:00',
                'expiry': '2026-09-20T00:00:00',
                'status': 'RESOLVED',
                'supplier_id': 'S001',
            },
        }

        ingredients = ['Chicken', 'Tomatoes', 'Onions', 'Rice', 'Wheat Flour', 'Lentils', 'Oil', 'Garam Masala', 'Turmeric', 'Coriander', 'Ghee', 'Cardamom']
        for i in range(397):
            code = f'BATCH-{i:04d}'
            sup = random.choice(self.suppliers)['id']
            self.batches[code] = {
                'id': f'B_BATCH{i:04d}',
                'code': code,
                'ingredient': random.choice(ingredients),
                'qty_kg': round(random.uniform(50.0, 500.0), 1),
                'received_at': '2026-09-10T00:00:00',
                'expiry': '2026-09-30T00:00:00',
                'status': 'NORMAL' if random.random() > 0.08 else 'MONITORING',
                'supplier_id': sup,
            }

        # Temperature Readings
        self.temps: dict[str, list[dict[str, Any]]] = {}
        for b_code, b in self.batches.items():
            t_list = []
            for h in range(8):
                celsius = round(random.uniform(3.5, 6.8), 1)
                if b_code == 'PNR-2047' and h == 3:
                    celsius = 14.2  # Critical spike
                t_list.append({
                    'ts': f'2026-09-18T{h+6:02d}:00:00',
                    'celsius': celsius,
                })
            self.temps[b_code] = t_list

        # Complaints
        self.complaints = [
            {
                'id': 'COMP-001',
                'text': 'Severe food poisoning and cramps after eating Paneer Tikka (Order ORD-4081)',
                'created_at': '2026-09-19T09:15:00',
                'severity': 'CRITICAL',
                'order_id': 'ORD-4081',
                'batch_code': 'PNR-2047',
            },
            {
                'id': 'COMP-002',
                'text': 'Acute stomach upset and nausea following Shahi Paneer dinner (Order ORD-4082)',
                'created_at': '2026-09-19T10:30:00',
                'severity': 'CRITICAL',
                'order_id': 'ORD-4082',
                'batch_code': 'PNR-2047',
            },
            {
                'id': 'COMP-003',
                'text': 'Hospitalized with gastroenteritis after Paneer Butter Masala meal (Order ORD-4083)',
                'created_at': '2026-09-19T11:05:00',
                'severity': 'CRITICAL',
                'order_id': 'ORD-4083',
                'batch_code': 'PNR-2047',
            },
            {
                'id': 'COMP-004',
                'text': 'Slight sour taste in Palak Paneer curry',
                'created_at': '2026-09-19T08:45:00',
                'severity': 'WARNING',
                'order_id': 'ORD-3012',
                'batch_code': 'VEG-9182',
            },
            {
                'id': 'COMP-005',
                'text': 'Late delivery and cold food package',
                'created_at': '2026-09-19T07:20:00',
                'severity': 'LOW',
                'order_id': 'ORD-1090',
                'batch_code': 'BATCH-0005',
            },
        ]
        for idx in range(6, 51):
            b_cand = random.choice(list(self.batches.keys()))
            self.complaints.append({
                'id': f'COMP-{idx:03d}',
                'text': f'Quality issue reported with batch {b_cand}',
                'created_at': '2026-09-19T06:00:00',
                'severity': 'LOW' if random.random() > 0.3 else 'MEDIUM',
                'order_id': f'ORD-{2000+idx}',
                'batch_code': b_cand,
            })

        # Recalls & Kitchen Tasks (Phase 10)
        self.recalls: dict[str, dict[str, Any]] = {
            'PNR-2047': {
                'id': 'REC_PNR_2047',
                'batch_code': 'PNR-2047',
                'status': 'INITIATED',
                'initiated_at': '2026-09-18T06:00:00',
                'initiated_by': 'Safety Command Center'
            }
        }
        self.tasks: dict[str, dict[str, Any]] = {}
        for i in range(12):
            k = self.kitchens[i]
            t_id = f"TASK_PNR_2047_{k['id']}"
            self.tasks[t_id] = {
                'id': t_id,
                'recall_id': 'REC_PNR_2047',
                'batch_code': 'PNR-2047',
                'kitchen_id': k['id'],
                'kitchen_name': k['name'],
                'kitchen_city': k['city'],
                'status': 'NOTIFIED',
                'updated_at': '2026-09-18T06:00:00',
                'updated_by': 'System',
                'note': 'Batch quarantined. Pending acknowledgement.',
                'lat': k['lat'],
                'lng': k['lng']
            }
        self.events: list[dict[str, Any]] = []

    def get_supplier_by_id(self, sup_id: str) -> Optional[dict[str, Any]]:
        for s in self.suppliers:
            if s['id'] == sup_id:
                return s
        return None

    def execute_read(self, query: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        q = query.strip()

        # 1. Health check: RETURN 1
        if "RETURN 1" in q:
            return [{"ok": 1}]

        # 2. Recall queries (Phase 10)
        if "MATCH (r:Recall {batch_code: $batch_code})" in q and "RETURN r.id AS id" in q:
            b_code = params.get('batch_code', 'PNR-2047')
            if b_code in self.recalls:
                r = self.recalls[b_code]
                return [{
                    'id': r['id'],
                    'status': r['status'],
                    'initiated_at': r['initiated_at'],
                    'initiated_by': r['initiated_by']
                }]
            return []

        if "MATCH (r:Recall {batch_code: $batch_code})-[:HAS_TASK]->(t:KitchenTask)" in q:
            b_code = params.get('batch_code', 'PNR-2047')
            matching_tasks = [t for t in self.tasks.values() if t['batch_code'] == b_code]
            return matching_tasks

        if "MATCH (r:Recall)-[:HAS_TASK]->(t:KitchenTask {id: $task_id})" in q:
            t_id = params.get('task_id')
            if t_id in self.tasks:
                return [self.tasks[t_id]]
            return []

        # 3. City Clusters query (Check this FIRST before other batch checks)
        if "WITH k.city AS city" in q or "any(s IN statuses WHERE s = 'CRITICAL')" in q:
            city_clusters = [
                {'city': 'Delhi', 'lat': 28.6139, 'lng': 77.2090, 'kitchen_count': 48, 'has_critical': True, 'has_monitoring': False},
                {'city': 'Gurugram', 'lat': 28.4595, 'lng': 77.0266, 'kitchen_count': 27, 'has_critical': False, 'has_monitoring': True},
                {'city': 'Noida', 'lat': 28.5355, 'lng': 77.3910, 'kitchen_count': 31, 'has_critical': True, 'has_monitoring': False},
                {'city': 'Ghaziabad', 'lat': 28.6692, 'lng': 77.4538, 'kitchen_count': 12, 'has_critical': False, 'has_monitoring': False},
                {'city': 'Faridabad', 'lat': 28.4089, 'lng': 77.3178, 'kitchen_count': 10, 'has_critical': False, 'has_monitoring': False},
            ]
            return city_clusters

        # 4. Overview KPI counts
        if "MATCH (k:Kitchen) RETURN count(k)" in q:
            return [{'c': 128}]
        if "MATCH (b:IngredientBatch) WHERE b.status IN ['NORMAL','MONITORING','WARNING','CRITICAL'] RETURN count(b)" in q:
            return [{'c': 4821}]
        if "MATCH (o:Order) RETURN count(o)" in q:
            return [{'c': 1024500}]
        if "MATCH (b:IngredientBatch) WHERE b.status IN ['MONITORING','WARNING','CRITICAL'] RETURN count(b)" in q:
            return [{'c': 3}]

        # 5. Recent activity queries in overview service
        if "MATCH (comp:Complaint)-[:ABOUT]->(o:Order)" in q and "message" in q:
            return [
                {'id': 'COMP-003', 'type': 'COMPLAINT', 'message': 'Complaint filed: Hospitalized with gastroenteritis (PNR-2047)', 'ts': '2026-09-19T11:05:00', 'severity': 'CRITICAL'},
                {'id': 'COMP-002', 'type': 'COMPLAINT', 'message': 'Complaint filed: Acute stomach upset after Shahi Paneer (PNR-2047)', 'ts': '2026-09-19T10:30:00', 'severity': 'CRITICAL'},
                {'id': 'COMP-001', 'type': 'COMPLAINT', 'message': 'Complaint filed: Severe food poisoning symptoms (PNR-2047)', 'ts': '2026-09-19T09:15:00', 'severity': 'CRITICAL'},
            ]
        if "WHERE b.status IN ['CRITICAL', 'MONITORING', 'WARNING']" in q and "message" in q:
            return [
                {'id': 'B_PNR2047', 'type': 'RECALL', 'message': 'Batch PNR-2047 marked CRITICAL (Paneer, Sharma Dairy)', 'ts': '2026-09-18T06:00:00', 'severity': 'CRITICAL'},
                {'id': 'B_VEG9182', 'type': 'RECALL', 'message': 'Batch VEG-9182 marked MONITORING (Spinach, Green Fields)', 'ts': '2026-09-17T08:00:00', 'severity': 'MONITORING'},
            ]

        # 6. Reverse investigation
        if "MATCH (comp:Complaint)-[:ABOUT]->(o:Order)" in q and "$complaint_ids" in q:
            comp_ids = params.get('complaint_ids', [])
            results = []
            for idx, c_id in enumerate(comp_ids):
                matching = next((c for c in self.complaints if c['id'] == c_id), None)
                if not matching:
                    matching = self.complaints[idx % len(self.complaints)]
                b_code = matching.get('batch_code', 'PNR-2047')
                b = self.batches.get(b_code, self.batches['PNR-2047'])
                sup = self.get_supplier_by_id(b['supplier_id'])
                results.append({
                    'complaint_id': c_id,
                    'order_id': matching.get('order_id', f'ORD-{4080+idx}'),
                    'dish_id': f"DISH_{c_id}",
                    'prep_lot_id': f"PL_{b['code']}_01",
                    'batch_code': b['code'],
                    'ingredient': b['ingredient'],
                    'supplier_id': sup['id'] if sup else 'S001',
                    'supplier_name': sup['name'] if sup else 'Supplier A',
                })
            return results

        # 7. Impact query for /api/recalls/{code}/impact
        if "count(DISTINCT k) AS kitchen_count" in q and "prep_lot_count" in q:
            code = params.get('code', 'PNR-2047')
            if code not in self.batches:
                return []
            b = self.batches[code]
            sup = self.get_supplier_by_id(b['supplier_id'])
            if code == 'PNR-2047':
                return [{
                    'batch_code': b['code'],
                    'ingredient': b['ingredient'],
                    'status': b['status'],
                    'supplier_name': sup['name'] if sup else 'Supplier A',
                    'kitchen_count': 12,
                    'prep_lot_count': 31,
                    'dish_count': 47,
                    'order_count': 1842,
                    'customer_count': 2913,
                }]
            else:
                return [{
                    'batch_code': b['code'],
                    'ingredient': b['ingredient'],
                    'status': b['status'],
                    'supplier_name': sup['name'] if sup else 'Supplier',
                    'kitchen_count': 5,
                    'prep_lot_count': 8,
                    'dish_count': 12,
                    'order_count': 320,
                    'customer_count': 450,
                }]

        # 8. Graph query for /api/recalls/{code}/graph
        if "query_main" in q or ("MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: $code})" in q and "RETURN s, b, pl, k, d" in q):
            code = params.get('code', 'PNR-2047')
            if code not in self.batches:
                return []
            b = self.batches[code]
            sup = self.get_supplier_by_id(b['supplier_id'])

            results = []
            num_pls = 31 if code == 'PNR-2047' else 8
            for p_idx in range(num_pls):
                k = self.kitchens[p_idx % len(self.kitchens)]
                pl_id = f"PL_{code.replace('-', '')}_{p_idx+1}"
                d_id = f"DISH_{code.replace('-', '')}_{p_idx+1}"
                results.append({
                    's': sup,
                    'b': b,
                    'pl': {'id': pl_id, 'batch_id': b['id']},
                    'k': k,
                    'd': {'id': d_id, 'prep_lot_id': pl_id},
                    'order_count': random.randint(25, 90),
                    'customer_count': random.randint(35, 120),
                })
            return results

        # 9. Graph Expand
        if "MATCH (d:Dish {id: $dish_id})-[:SOLD_IN]->(o:Order)" in q:
            dish_id = params.get('dish_id', '')
            results = []
            for o_idx in range(6):
                ord_id = f"ORD_{dish_id}_{o_idx+1}"
                cust_id = f"CUST_{o_idx+1}"
                results.append({
                    'd': {'id': dish_id},
                    'o': {'id': ord_id, 'dish_id': dish_id},
                    'c': {'id': cust_id, 'name': f'Customer #{random.randint(100, 999)}'},
                })
            return results

        # 10. Batches list for /api/recalls and active_recalls in overview
        if "MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch)" in q and ("WHERE b.status IN" in q or "b.qty_kg AS qty_kg" in q):
            results = []
            for b in self.batches.values():
                if b['status'] in ['MONITORING', 'WARNING', 'CRITICAL', 'RESOLVED']:
                    sup = self.get_supplier_by_id(b['supplier_id'])
                    k_count = 12 if b['code'] == 'PNR-2047' else (4 if b['code'] == 'VEG-9182' else 2)
                    o_count = 1842 if b['code'] == 'PNR-2047' else (250 if b['code'] == 'VEG-9182' else 80)
                    results.append({
                        'code': b['code'],
                        'ingredient': b['ingredient'],
                        'status': b['status'],
                        'supplier_name': sup['name'] if sup else 'Unknown Supplier',
                        'supplier_id': b['supplier_id'],
                        'qty_kg': b['qty_kg'],
                        'received_at': b['received_at'],
                        'expiry': b['expiry'],
                        'kitchen_count': k_count,
                        'order_count': o_count,
                    })
            # Sort critical first
            prio = {'CRITICAL': 0, 'WARNING': 1, 'MONITORING': 2, 'RESOLVED': 3, 'NORMAL': 4}
            results.sort(key=lambda x: prio.get(x['status'], 5))
            return results

        # 11. Batch existence check
        if "MATCH (b:IngredientBatch {code: $code}) RETURN b" in q or "MATCH (b:IngredientBatch {code: $code}) RETURN b.status" in q:
            code = params.get('code')
            if code in self.batches:
                b = self.batches[code]
                return [{'b': b, 'status': b['status']}]
            return []

        # 12. Complaints search
        if "MATCH (c:Complaint)" in q:
            query_str = (params.get('q') or '').lower()
            filtered = [
                c for c in self.complaints
                if not query_str or query_str in c['text'].lower() or query_str in c['id'].lower()
            ]
            return [
                {
                    'id': c['id'],
                    'text': c['text'],
                    'created_at': c['created_at'],
                    'severity': c['severity'],
                    'order_id': c['order_id'],
                }
                for c in filtered[:50]
            ]

        # 13. Batch Detail with Temperature Timeline
        if "MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: $code})" in q and "HAS_TEMP" in q:
            code = params.get('code', 'PNR-2047')
            if code not in self.batches:
                return []
            b = self.batches[code]
            sup = self.get_supplier_by_id(b['supplier_id'])
            temps = self.temps.get(code, [])
            return [{'b': b, 's': sup, 'temps': temps}]

        # 14. Kitchens list and detail
        if "MATCH (k:Kitchen)" in q and "affected_batch_count" in q:
            results = []
            for k in self.kitchens:
                aff = 1 if k['city'] in ['Delhi', 'Noida'] else 0
                results.append({
                    'id': k['id'],
                    'name': k['name'],
                    'city': k['city'],
                    'lat': k['lat'],
                    'lng': k['lng'],
                    'affected_batch_count': aff,
                })
            return results

        if "MATCH (k:Kitchen {id: $id})" in q:
            k_id = params.get('id', 'K001')
            k = next((item for item in self.kitchens if item['id'] == k_id), self.kitchens[0])
            inv = [
                {'code': 'PNR-2047', 'ingredient': 'Paneer', 'status': 'CRITICAL'},
                {'code': 'VEG-9182', 'ingredient': 'Spinach', 'status': 'MONITORING'},
                {'code': 'BATCH-0012', 'ingredient': 'Tomatoes', 'status': 'NORMAL'},
            ]
            return [{'k': k, 'inventory': inv}]

        # 15. Suppliers list and detail
        if "MATCH (s:Supplier)" in q and "flagged_batches" in q:
            results = []
            for s in self.suppliers:
                flagged = 1 if s['id'] == 'S001' else (1 if s['id'] == 'S002' else 0)
                results.append({
                    'id': s['id'],
                    'name': s['name'],
                    'city': s['city'],
                    'category': s['category'],
                    'total_batches': 35,
                    'flagged_batches': flagged,
                })
            return results

        if "MATCH (s:Supplier {id: $id})" in q:
            s_id = params.get('id', 'S001')
            s = self.get_supplier_by_id(s_id) or self.suppliers[0]
            recent = [
                {'code': 'PNR-2047', 'status': 'CRITICAL'},
                {'code': 'MILK-774', 'status': 'RESOLVED'},
                {'code': 'BATCH-0044', 'status': 'NORMAL'},
            ]
            return [{
                'id': s['id'],
                'name': s['name'],
                'city': s['city'],
                'category': s['category'],
                'total_batches': 35,
                'flagged_batches': 2 if s['id'] == 'S001' else 0,
                'recent_batches': recent,
            }]

        return []

    def execute_write(self, query: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        q = query.strip()
        
        # Batch status update
        if "SET b.status = 'CRITICAL'" in q or "SET b.status = $status" in q:
            code = params.get('code')
            st = params.get('status', 'CRITICAL')
            if code in self.batches:
                self.batches[code]['status'] = st
                return [{'b': self.batches[code]}]

        # Recall MERGE
        if "MERGE (r:Recall {batch_code: $batch_code})" in q:
            b_code = params.get('batch_code', 'PNR-2047')
            if b_code not in self.recalls:
                self.recalls[b_code] = {
                    'id': params.get('recall_id', f"REC_{b_code}"),
                    'batch_code': b_code,
                    'status': 'INITIATED',
                    'initiated_at': params.get('now', '2026-09-18T06:00:00'),
                    'initiated_by': params.get('initiated_by', 'System')
                }
            return [{'r': self.recalls[b_code]}]

        # KitchenTask MERGE
        if "MERGE (t:KitchenTask {id: $task_id})" in q:
            t_id = params.get('task_id')
            b_code = params.get('batch_code', 'PNR-2047')
            k_id = params.get('kitchen_id', 'K001')
            k = next((item for item in self.kitchens if item['id'] == k_id), self.kitchens[0])
            if t_id not in self.tasks:
                self.tasks[t_id] = {
                    'id': t_id,
                    'recall_id': self.recalls.get(b_code, {}).get('id', f"REC_{b_code}"),
                    'batch_code': b_code,
                    'kitchen_id': k['id'],
                    'kitchen_name': k['name'],
                    'kitchen_city': k['city'],
                    'status': 'NOTIFIED',
                    'updated_at': params.get('now', '2026-09-18T06:00:00'),
                    'updated_by': 'System',
                    'note': 'Batch quarantined. Pending acknowledgement.',
                    'lat': k['lat'],
                    'lng': k['lng']
                }
            return [{'t': self.tasks[t_id]}]

        # KitchenTask UPDATE
        if "MATCH (t:KitchenTask {id: $task_id})" in q and "SET t.status = $status" in q:
            t_id = params.get('task_id')
            if t_id in self.tasks:
                self.tasks[t_id]['status'] = params.get('status', 'ACKNOWLEDGED')
                self.tasks[t_id]['updated_at'] = params.get('now', '2026-09-18T06:00:00')
                self.tasks[t_id]['updated_by'] = params.get('updated_by', 'Kitchen Lead')
                self.tasks[t_id]['note'] = params.get('note', '')
                return [{'t': self.tasks[t_id]}]

        # Recall STATUS UPDATE
        if "MATCH (r:Recall {batch_code: $batch_code}) SET r.status = $status" in q:
            b_code = params.get('batch_code')
            if b_code in self.recalls:
                self.recalls[b_code]['status'] = params.get('status', 'INITIATED')
                return [{'r': self.recalls[b_code]}]

        # Event CREATE
        if "CREATE (e:Event" in q:
            evt = {
                'id': params.get('event_id', params.get('evt_id', f"EVT_{len(self.events)+1}")),
                'type': params.get('type', 'SYSTEM_EVENT'),
                'message': params.get('message', ''),
                'ts': params.get('now', '2026-09-18T06:00:00'),
                'severity': params.get('severity', 'NORMAL')
            }
            self.events.append(evt)
            return [{'e': evt}]

        return []


mock_store = MockGraphStore()

