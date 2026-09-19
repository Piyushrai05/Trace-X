from app.db import db
from app.schemas.overview import OverviewResponse, CityCluster, ActivityItem
from app.schemas.recalls import RecallListItem


async def get_overview() -> OverviewResponse:
    k_res = await db.execute_read("MATCH (k:Kitchen) RETURN count(k) AS c", {})
    k_cnt: int = k_res[0]["c"] if k_res else 0

    b_res = await db.execute_read(
        "MATCH (b:IngredientBatch) WHERE b.status IN ['NORMAL','MONITORING','WARNING','CRITICAL'] RETURN count(b) AS c",
        {},
    )
    b_cnt: int = b_res[0]["c"] if b_res else 0

    o_res = await db.execute_read("MATCH (o:Order) RETURN count(o) AS c", {})
    o_cnt: int = o_res[0]["c"] if o_res else 0

    r_res = await db.execute_read(
        "MATCH (b:IngredientBatch) WHERE b.status IN ['MONITORING','WARNING','CRITICAL'] RETURN count(b) AS c",
        {},
    )
    r_cnt: int = r_res[0]["c"] if r_res else 0

    # City clusters — group kitchens by city and check for affected batch statuses
    cc_res = await db.execute_read(
        """
        MATCH (k:Kitchen)
        OPTIONAL MATCH (k)<-[:PREPARED_AT]-(pl:PrepLot)<-[:USED_IN]-(b:IngredientBatch)
        WHERE b.status IN ['MONITORING', 'WARNING', 'CRITICAL']
        WITH k.city AS city, avg(k.lat) AS lat, avg(k.lng) AS lng,
             count(DISTINCT k) AS kitchen_count, collect(DISTINCT b.status) AS statuses
        RETURN city, lat, lng, kitchen_count,
               any(s IN statuses WHERE s = 'CRITICAL') AS has_critical,
               any(s IN statuses WHERE s IN ['MONITORING', 'WARNING']) AS has_monitoring
        ORDER BY kitchen_count DESC
        """,
        {},
    )
    clusters = [CityCluster(**r) for r in cc_res]

    # Active recalls — batches with non-NORMAL / non-RESOLVED status for the sidebar card
    ar_res = await db.execute_read(
        """
        MATCH (s:Supplier)-[:SUPPLIED]->(b:IngredientBatch)
        WHERE b.status IN ['MONITORING', 'WARNING', 'CRITICAL']
        OPTIONAL MATCH (b)-[:USED_IN]->(:PrepLot)-[:PREPARED_AT]->(k:Kitchen)
        OPTIONAL MATCH (b)-[:USED_IN]->(:PrepLot)-[:MADE_INTO]->(:Dish)-[:SOLD_IN]->(o:Order)
        RETURN b.code AS code, b.ingredient AS ingredient, b.status AS status,
               s.name AS supplier_name, s.id AS supplier_id,
               b.qty_kg AS qty_kg, b.received_at AS received_at, b.expiry AS expiry,
               count(DISTINCT k) AS kitchen_count, count(DISTINCT o) AS order_count
        ORDER BY
          CASE b.status WHEN 'CRITICAL' THEN 0 WHEN 'WARNING' THEN 1 WHEN 'MONITORING' THEN 2 ELSE 3 END,
          b.received_at DESC
        LIMIT 10
        """,
        {},
    )
    active_recalls = [RecallListItem(**r) for r in ar_res]

    # Recent activity — pull from complaints + batch status changes (using batch data as proxy)
    act_res = await db.execute_read(
        """
        MATCH (comp:Complaint)-[:ABOUT]->(o:Order)
        RETURN comp.id AS id, 'COMPLAINT' AS type,
               'New complaint filed: ' + comp.text AS message,
               comp.created_at AS ts, comp.severity AS severity
        ORDER BY comp.created_at DESC LIMIT 5
        """,
        {},
    )
    batch_act = await db.execute_read(
        """
        MATCH (b:IngredientBatch)
        WHERE b.status IN ['CRITICAL', 'MONITORING', 'WARNING']
        RETURN b.id AS id, 'RECALL' AS type,
               'Batch ' + b.code + ' marked ' + b.status AS message,
               b.received_at AS ts, b.status AS severity
        ORDER BY b.received_at DESC LIMIT 5
        """,
        {},
    )
    activity_raw = (act_res or []) + (batch_act or [])
    activity_raw.sort(key=lambda x: x.get("ts", ""), reverse=True)
    recent_activity = [ActivityItem(**a) for a in activity_raw[:10]]

    return OverviewResponse(
        kitchen_count=k_cnt,
        active_batch_count=b_cnt,
        order_count=o_cnt,
        active_recall_count=r_cnt,
        city_clusters=clusters,
        recent_activity=recent_activity,
        active_recalls=active_recalls,
    )
