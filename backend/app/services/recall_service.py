import time
from fastapi import HTTPException
from app.db import db
from app.schemas.recalls import RecallListItem, ImpactSummary, GraphPayload, GraphNode, GraphEdge, InitiateRecallResponse

async def list_recalls() -> list[RecallListItem]:
    query = """
    MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch)
    WHERE b.status IN ['MONITORING', 'WARNING', 'CRITICAL', 'RESOLVED']
    OPTIONAL MATCH (b)-[:USED_IN]->(:PrepLot)-[:PREPARED_AT]->(k:Kitchen)
    OPTIONAL MATCH (b)-[:USED_IN]->(:PrepLot)-[:MADE_INTO]->(:Dish)-[:SOLD_IN]->(o:Order)
    RETURN b.code AS code, b.ingredient AS ingredient, b.status AS status,
           s.name AS supplier_name, s.id AS supplier_id,
           b.qty_kg AS qty_kg, b.received_at AS received_at, b.expiry AS expiry,
           count(DISTINCT k) AS kitchen_count, count(DISTINCT o) AS order_count
    ORDER BY 
      CASE b.status WHEN 'CRITICAL' THEN 0 WHEN 'WARNING' THEN 1 WHEN 'MONITORING' THEN 2 WHEN 'RESOLVED' THEN 3 ELSE 4 END,
      b.received_at DESC
    """
    res = await db.execute_read(query, {})
    return [RecallListItem(**r) for r in res]

async def get_impact(batch_code: str) -> ImpactSummary:
    start = time.monotonic()
    query = """
    MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: $code})
    MATCH (b)-[:USED_IN]->(pl:PrepLot)
    OPTIONAL MATCH (pl)-[:PREPARED_AT]->(k:Kitchen)
    OPTIONAL MATCH (pl)-[:MADE_INTO]->(d:Dish)
    OPTIONAL MATCH (d)-[:SOLD_IN]->(o:Order)
    OPTIONAL MATCH (o)-[:PLACED_BY]->(c:Customer)
    RETURN b.code AS batch_code, b.ingredient AS ingredient, b.status AS status,
           s.name AS supplier_name,
           count(DISTINCT k) AS kitchen_count,
           count(DISTINCT pl) AS prep_lot_count,
           count(DISTINCT d) AS dish_count,
           count(DISTINCT o) AS order_count,
           count(DISTINCT c) AS customer_count
    """
    res = await db.execute_read(query, {'code': batch_code})
    if not res:
        raise HTTPException(status_code=404, detail="Batch not found")
    elapsed = round((time.monotonic() - start) * 1000, 2)
    data = res[0]
    return ImpactSummary(**data, elapsed_ms=elapsed)

async def get_graph(batch_code: str, expand: str | None) -> GraphPayload:
    # First verify batch exists
    check = await db.execute_read("MATCH (b:IngredientBatch {code: $code}) RETURN b", {'code': batch_code})
    if not check:
        raise HTTPException(status_code=404, detail="Batch not found")

    query_main = """
    MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch {code: $code})
    OPTIONAL MATCH (b)-[:USED_IN]->(pl:PrepLot)
    OPTIONAL MATCH (pl)-[:PREPARED_AT]->(k:Kitchen)
    OPTIONAL MATCH (pl)-[:MADE_INTO]->(d:Dish)
    OPTIONAL MATCH (d)-[:SOLD_IN]->(o:Order)
    OPTIONAL MATCH (o)-[:PLACED_BY]->(c:Customer)
    RETURN s, b, pl, k, d,
           count(DISTINCT o) AS order_count,
           count(DISTINCT c) AS customer_count
    """
    res = await db.execute_read(query_main, {'code': batch_code})
    
    nodes = {}
    edges = []

    def add_node(n_id, n_type, label, shape):
        if n_id and n_id not in nodes:
            nodes[n_id] = GraphNode(id=n_id, type=n_type, label=label, data={'shape': shape})
    def add_edge(src, tgt, type_):
        if src and tgt:
            edges.append(GraphEdge(id=f"{src}-{tgt}-{type_}", source=src, target=tgt, type=type_))

    for r in res:
        if r.get('s'): add_node(r['s']['id'], 'supplier', r['s']['name'], 'ellipse')
        if r.get('b'): add_node(r['b']['id'], 'batch', r['b']['code'], 'diamond')
        if r.get('s') and r.get('b'): add_edge(r['s']['id'], r['b']['id'], 'SUPPLIED')
        
        if r.get('pl'):
            add_node(r['pl']['id'], 'prep_lot', r['pl']['id'], 'diamond')
            add_edge(r['b']['id'], r['pl']['id'], 'USED_IN')
        
        if r.get('k') and r.get('pl'):
            add_node(r['k']['id'], 'kitchen', r['k']['name'], 'round-rectangle')
            add_edge(r['pl']['id'], r['k']['id'], 'PREPARED_AT')
            
        if r.get('d') and r.get('pl'):
            add_node(r['d']['id'], 'dish', r['d']['id'], 'ellipse')
            add_edge(r['pl']['id'], r['d']['id'], 'MADE_INTO')
            
            oc = r['order_count']
            if oc > 0:
                agg_id = f"agg_ord_{r['d']['id']}"
                add_node(agg_id, 'order_aggregate', f"{oc} Orders", 'rectangle')
                add_edge(r['d']['id'], agg_id, 'SOLD_IN')

    if expand:
        query_expand = """
        MATCH (d:Dish {id: $dish_id})-[:SOLD_IN]->(o:Order)-[:PLACED_BY]->(c:Customer)
        RETURN d, o, c
        """
        res_exp = await db.execute_read(query_expand, {'dish_id': expand})
        for r in res_exp:
            d = r.get('d')
            o = r.get('o')
            c = r.get('c')
            if d and o:
                add_node(o['id'], 'order', o['id'], 'rectangle')
                add_edge(d['id'], o['id'], 'SOLD_IN')
            if o and c:
                add_node(c['id'], 'customer', c['name'], 'ellipse')
                add_edge(o['id'], c['id'], 'PLACED_BY')

    return GraphPayload(nodes=list(nodes.values()), edges=edges, meta={'node_count': len(nodes)})

async def initiate_recall(batch_code: str) -> InitiateRecallResponse:
    from app.services.task_service import task_service
    prev_status, impact = await task_service.initiate_recall_workflow(batch_code, initiated_by="Safety Command Center")
    return InitiateRecallResponse(batch_code=batch_code, previous_status=prev_status, new_status='CRITICAL', impact=impact)

