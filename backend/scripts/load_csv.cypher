// ============================================================================
// TraceX: Neo4j AuraDB Cypher CSV Import Script
// Use this if loading CSVs hosted on GitHub / S3 / Neo4j Data Importer
// Replace $BASE_URL with the public URL (e.g. 'https://raw.githubusercontent.com/.../backend/data/')
// ============================================================================

// 1. Constraints & Indexes
CREATE CONSTRAINT supplier_id IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT kitchen_id IF NOT EXISTS FOR (k:Kitchen) REQUIRE k.id IS UNIQUE;
CREATE CONSTRAINT batch_id IF NOT EXISTS FOR (b:IngredientBatch) REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT batch_code IF NOT EXISTS FOR (b:IngredientBatch) REQUIRE b.code IS UNIQUE;
CREATE CONSTRAINT preplot_id IF NOT EXISTS FOR (p:PrepLot) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT dish_id IF NOT EXISTS FOR (d:Dish) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.id IS UNIQUE;
CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT complaint_id IF NOT EXISTS FOR (c:Complaint) REQUIRE c.id IS UNIQUE;

CREATE INDEX batch_code_idx IF NOT EXISTS FOR (b:IngredientBatch) ON (b.code);
CREATE INDEX batch_status_idx IF NOT EXISTS FOR (b:IngredientBatch) ON (b.status);
CREATE INDEX order_placed_at_idx IF NOT EXISTS FOR (o:Order) ON (o.placed_at);

// 2. Load Suppliers
LOAD CSV WITH HEADERS FROM 'file:///suppliers.csv' AS row
CREATE (:Supplier {
  id: row.id,
  name: row.name,
  city: row.city,
  category: row.category
});

// 3. Load Kitchens
LOAD CSV WITH HEADERS FROM 'file:///kitchens.csv' AS row
CREATE (:Kitchen {
  id: row.id,
  name: row.name,
  city: row.city,
  lat: toFloat(row.lat),
  lng: toFloat(row.lng)
});

// 4. Load Ingredient Batches & connect Supplier
LOAD CSV WITH HEADERS FROM 'file:///ingredient_batches.csv' AS row
MATCH (s:Supplier {id: row.supplier_id})
CREATE (b:IngredientBatch {
  id: row.id,
  code: row.code,
  ingredient: row.ingredient,
  qty_kg: toFloat(row.qty_kg),
  received_at: row.received_at,
  expiry: row.expiry,
  status: row.status
})
CREATE (s)-[:SUPPLIED]->(b);

// 5. Load Temperature Logs
LOAD CSV WITH HEADERS FROM 'file:///temp_readings.csv' AS row
MATCH (b:IngredientBatch {id: row.batch_id})
CREATE (tr:TempReading {ts: row.ts, celsius: toFloat(row.celsius)})
CREATE (b)-[:HAS_TEMP]->(tr);

// 6. Load Prep Lots & connect Batch + Kitchen
LOAD CSV WITH HEADERS FROM 'file:///prep_lots.csv' AS row
MATCH (b:IngredientBatch {id: row.batch_id}), (k:Kitchen {id: row.kitchen_id})
CREATE (pl:PrepLot {id: row.id})
CREATE (b)-[:USED_IN]->(pl)
CREATE (pl)-[:PREPARED_AT]->(k);

// 7. Load Dishes & connect PrepLot
LOAD CSV WITH HEADERS FROM 'file:///dishes.csv' AS row
MATCH (pl:PrepLot {id: row.prep_lot_id})
CREATE (d:Dish {id: row.id})
CREATE (pl)-[:MADE_INTO]->(d);

// 8. Load Customers
LOAD CSV WITH HEADERS FROM 'file:///customers.csv' AS row
CREATE (:Customer {id: row.id, name: row.name});

// 9. Load Orders & connect Dish + Customer
LOAD CSV WITH HEADERS FROM 'file:///orders.csv' AS row
MATCH (d:Dish {id: row.dish_id}), (c:Customer {id: row.customer_id})
CREATE (o:Order {id: row.id, placed_at: row.placed_at})
CREATE (d)-[:SOLD_IN]->(o)
CREATE (o)-[:PLACED_BY]->(c);

// 10. Load Complaints & connect Order
LOAD CSV WITH HEADERS FROM 'file:///complaints.csv' AS row
MATCH (o:Order {id: row.order_id})
CREATE (comp:Complaint {id: row.id, text: row.text, severity: row.severity, created_at: row.created_at})
CREATE (comp)-[:ABOUT]->(o);
