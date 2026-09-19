// Unique constraints
CREATE CONSTRAINT supplier_id IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT kitchen_id IF NOT EXISTS FOR (k:Kitchen) REQUIRE k.id IS UNIQUE;
CREATE CONSTRAINT batch_id IF NOT EXISTS FOR (b:IngredientBatch) REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT batch_code IF NOT EXISTS FOR (b:IngredientBatch) REQUIRE b.code IS UNIQUE;
CREATE CONSTRAINT preplot_id IF NOT EXISTS FOR (p:PrepLot) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT dish_id IF NOT EXISTS FOR (d:Dish) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.id IS UNIQUE;
CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT complaint_id IF NOT EXISTS FOR (c:Complaint) REQUIRE c.id IS UNIQUE;

// Indexes
CREATE INDEX batch_code_idx IF NOT EXISTS FOR (b:IngredientBatch) ON (b.code);
CREATE INDEX batch_status_idx IF NOT EXISTS FOR (b:IngredientBatch) ON (b.status);
CREATE INDEX order_placed_at_idx IF NOT EXISTS FOR (o:Order) ON (o.placed_at);
