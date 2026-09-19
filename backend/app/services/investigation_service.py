from app.db import db
from app.schemas.investigations import ReverseInvestigationResponse, StageCounts, CandidateBatch
from app.schemas.recalls import GraphPayload, GraphNode, GraphEdge

async def run_reverse_investigation(complaint_ids: list[str]) -> ReverseInvestigationResponse:
    query = """
    MATCH (comp:Complaint)-[:ABOUT]->(o:Order)<-[:SOLD_IN]-(d:Dish)<-[:MADE_INTO]-(pl:PrepLot)<-[:USED_IN]-(b:IngredientBatch)<-[:SUPPLIED]-(s:Supplier)
    WHERE comp.id IN $complaint_ids
    RETURN comp.id AS complaint_id,
           o.id AS order_id, d.id AS dish_id, pl.id AS prep_lot_id,
           b.code AS batch_code, b.ingredient AS ingredient,
           s.id AS supplier_id, s.name AS supplier_name
    """
    res = await db.execute_read(query, {'complaint_ids': complaint_ids})
    
    comps, ords, dishs, pls, batches, sups = set(), set(), set(), set(), set(), set()
    batch_complaint_map = {}
    batch_info = {}

    nodes = {}
    edges = []

    def add_node(nid, ntype, lbl, shp):
        if nid not in nodes: nodes[nid] = GraphNode(id=nid, type=ntype, label=lbl, data={'shape': shp})
    def add_edge(src, tgt, typ):
        edges.append(GraphEdge(id=f"{src}-{tgt}-{typ}", source=src, target=tgt, type=typ))

    for r in res:
        comps.add(r['complaint_id'])
        ords.add(r['order_id'])
        dishs.add(r['dish_id'])
        pls.add(r['prep_lot_id'])
        batches.add(r['batch_code'])
        sups.add(r['supplier_id'])
        
        bc = r['batch_code']
        if bc not in batch_complaint_map: batch_complaint_map[bc] = set()
        batch_complaint_map[bc].add(r['complaint_id'])
        batch_info[bc] = {'ingredient': r['ingredient'], 'supplier_name': r['supplier_name']}

        add_node(r['supplier_id'], 'supplier', r['supplier_name'], 'ellipse')
        add_node(r['batch_code'], 'batch', r['batch_code'], 'diamond')
        add_node(r['prep_lot_id'], 'prep_lot', r['prep_lot_id'], 'diamond')
        add_node(r['dish_id'], 'dish', r['dish_id'], 'ellipse')
        add_node(r['order_id'], 'order', r['order_id'], 'rectangle')
        
        add_edge(r['supplier_id'], r['batch_code'], 'SUPPLIED')
        add_edge(r['batch_code'], r['prep_lot_id'], 'USED_IN')
        add_edge(r['prep_lot_id'], r['dish_id'], 'MADE_INTO')
        add_edge(r['dish_id'], r['order_id'], 'SOLD_IN')

    total_c = len(comps)
    candidates = []
    for bc, comp_set in batch_complaint_map.items():
        candidates.append(CandidateBatch(
            batch_code=bc,
            ingredient=batch_info[bc]['ingredient'],
            supplier_name=batch_info[bc]['supplier_name'],
            complaint_count=len(comp_set),
            confidence_score=len(comp_set) / total_c if total_c else 0
        ))
    candidates.sort(key=lambda x: x.complaint_count, reverse=True)

    stage_counts = StageCounts(
        complaints=len(comps), orders=len(ords), dishes=len(dishs),
        prep_lots=len(pls), batches=len(batches), suppliers=len(sups)
    )

    graph = GraphPayload(nodes=list(nodes.values()), edges=edges, meta={'node_count': len(nodes)})

    return ReverseInvestigationResponse(stage_counts=stage_counts, candidates=candidates, graph=graph)
