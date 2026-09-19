import csv
import os
import sys
import time
from dotenv import load_dotenv
from neo4j import GraphDatabase

def load_csv_rows(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def main():
    # Load .env from backend directory
    load_dotenv()
    
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USERNAME", "neo4j")
    password = os.getenv("NEO4J_PASSWORD")
    database = os.getenv("NEO4J_DATABASE", "neo4j")

    if not uri or not password:
        print("❌ Error: NEO4J_URI and NEO4J_PASSWORD must be set in backend/.env")
        print("Example:")
        print("NEO4J_URI=neo4j+s://<your-id>.databases.neo4j.io")
        print("NEO4J_USERNAME=neo4j")
        print("NEO4J_PASSWORD=your-aura-password")
        sys.exit(1)

    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    if not os.path.exists(data_dir):
        print(f"Creating CSV files first...")
        from generate_csv import generate_csv_data
        generate_csv_data(data_dir)

    print(f"🔌 Connecting to Neo4j AuraDB at {uri}...")
    driver = GraphDatabase.driver(uri, auth=(user, password))
    driver.verify_connectivity()
    print("✅ Connected to Neo4j AuraDB successfully!")

    start_time = time.monotonic()

    with driver.session(database=database) as session:
        print("🧹 Clearing existing data...")
        session.run("MATCH (n) DETACH DELETE n")

        print("🔒 Applying unique constraints & indexes...")
        constraints = [
            "CREATE CONSTRAINT supplier_id IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT kitchen_id IF NOT EXISTS FOR (k:Kitchen) REQUIRE k.id IS UNIQUE",
            "CREATE CONSTRAINT batch_id IF NOT EXISTS FOR (b:IngredientBatch) REQUIRE b.id IS UNIQUE",
            "CREATE CONSTRAINT batch_code IF NOT EXISTS FOR (b:IngredientBatch) REQUIRE b.code IS UNIQUE",
            "CREATE CONSTRAINT preplot_id IF NOT EXISTS FOR (p:PrepLot) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT dish_id IF NOT EXISTS FOR (d:Dish) REQUIRE d.id IS UNIQUE",
            "CREATE CONSTRAINT order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.id IS UNIQUE",
            "CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT complaint_id IF NOT EXISTS FOR (c:Complaint) REQUIRE c.id IS UNIQUE",
            "CREATE INDEX batch_code_idx IF NOT EXISTS FOR (b:IngredientBatch) ON (b.code)",
            "CREATE INDEX batch_status_idx IF NOT EXISTS FOR (b:IngredientBatch) ON (b.status)",
            "CREATE INDEX order_placed_at_idx IF NOT EXISTS FOR (o:Order) ON (o.placed_at)",
        ]
        for stmt in constraints:
            session.run(stmt)

        # 1. Suppliers
        suppliers = load_csv_rows(os.path.join(data_dir, 'suppliers.csv'))
        print(f"📦 Importing {len(suppliers)} Suppliers...")
        session.run("UNWIND $rows AS r CREATE (s:Supplier {id: r.id, name: r.name, city: r.city, category: r.category})", rows=suppliers)

        # 2. Kitchens
        kitchens = load_csv_rows(os.path.join(data_dir, 'kitchens.csv'))
        for k in kitchens:
            k['lat'] = float(k['lat'])
            k['lng'] = float(k['lng'])
        print(f"📦 Importing {len(kitchens)} Kitchens...")
        session.run("UNWIND $rows AS r CREATE (k:Kitchen {id: r.id, name: r.name, city: r.city, lat: r.lat, lng: r.lng})", rows=kitchens)

        # 3. Ingredient Batches
        batches = load_csv_rows(os.path.join(data_dir, 'ingredient_batches.csv'))
        for b in batches:
            b['qty_kg'] = float(b['qty_kg'])
        print(f"📦 Importing {len(batches)} Batches & (Supplier)-[:SUPPLIED]->(Batch)...")
        session.run("""
        UNWIND $rows AS r
        MATCH (s:Supplier {id: r.supplier_id})
        CREATE (b:IngredientBatch {
            id: r.id, code: r.code, ingredient: r.ingredient,
            qty_kg: r.qty_kg, received_at: r.received_at,
            expiry: r.expiry, status: r.status
        })
        CREATE (s)-[:SUPPLIED]->(b)
        """, rows=batches)

        # 4. Temperature Readings
        temps = load_csv_rows(os.path.join(data_dir, 'temp_readings.csv'))
        for t in temps:
            t['celsius'] = float(t['celsius'])
        print(f"📦 Importing {len(temps)} Temperature Readings...")
        session.run("""
        UNWIND $rows AS r
        MATCH (b:IngredientBatch {id: r.batch_id})
        CREATE (tr:TempReading {ts: r.ts, celsius: r.celsius})
        CREATE (b)-[:HAS_TEMP]->(tr)
        """, rows=temps)

        # 5. Prep Lots
        prep_lots = load_csv_rows(os.path.join(data_dir, 'prep_lots.csv'))
        print(f"📦 Importing {len(prep_lots)} Prep Lots in batches...")
        for i in range(0, len(prep_lots), 1000):
            session.run("""
            UNWIND $rows AS r
            MATCH (b:IngredientBatch {id: r.batch_id}), (k:Kitchen {id: r.kitchen_id})
            CREATE (pl:PrepLot {id: r.id})
            CREATE (b)-[:USED_IN]->(pl)
            CREATE (pl)-[:PREPARED_AT]->(k)
            """, rows=prep_lots[i:i+1000])

        # 6. Dishes
        dishes = load_csv_rows(os.path.join(data_dir, 'dishes.csv'))
        print(f"📦 Importing {len(dishes)} Dishes in batches...")
        for i in range(0, len(dishes), 1000):
            session.run("""
            UNWIND $rows AS r
            MATCH (pl:PrepLot {id: r.prep_lot_id})
            CREATE (d:Dish {id: r.id})
            CREATE (pl)-[:MADE_INTO]->(d)
            """, rows=dishes[i:i+1000])

        # 7. Customers
        customers = load_csv_rows(os.path.join(data_dir, 'customers.csv'))
        print(f"📦 Importing {len(customers)} Customers in batches...")
        for i in range(0, len(customers), 1000):
            session.run("UNWIND $rows AS r CREATE (c:Customer {id: r.id, name: r.name})", rows=customers[i:i+1000])

        # 8. Orders
        orders = load_csv_rows(os.path.join(data_dir, 'orders.csv'))
        print(f"📦 Importing {len(orders)} Orders in batches...")
        for i in range(0, len(orders), 1000):
            session.run("""
            UNWIND $rows AS r
            MATCH (d:Dish {id: r.dish_id}), (c:Customer {id: r.customer_id})
            CREATE (o:Order {id: r.id, placed_at: r.placed_at})
            CREATE (d)-[:SOLD_IN]->(o)
            CREATE (o)-[:PLACED_BY]->(c)
            """, rows=orders[i:i+1000])

        # 9. Complaints
        complaints = load_csv_rows(os.path.join(data_dir, 'complaints.csv'))
        print(f"📦 Importing {len(complaints)} Complaints...")
        session.run("""
        UNWIND $rows AS r
        MATCH (o:Order {id: r.order_id})
        CREATE (comp:Complaint {id: r.id, text: r.text, severity: r.severity, created_at: r.created_at})
        CREATE (comp)-[:ABOUT]->(o)
        """, rows=complaints)

        # Verification counts
        node_res = session.run("MATCH (n) RETURN count(n) AS cnt").single()
        rel_res = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt").single()
        nodes = node_res['cnt']
        rels = rel_res['cnt']
        elapsed = round(time.monotonic() - start_time, 2)

        print(f"\n🎉 Import Completed in {elapsed}s!")
        print(f"📊 Total Nodes in AuraDB: {nodes:,} (Budget limit: 40,000)")
        print(f"🔗 Total Relationships in AuraDB: {rels:,} (Budget limit: 120,000)")

    driver.close()

if __name__ == '__main__':
    main()
