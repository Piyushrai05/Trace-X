import os
import sys
import random
from dotenv import load_dotenv
from neo4j import GraphDatabase

def main():
    load_dotenv()
    random.seed(42)
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USERNAME")
    password = os.getenv("NEO4J_PASSWORD")
    
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
    # ... seed data generation logic ...
    # This is a very complex script as per prompt. I will fill the details.
    
    # 1. Connect
    # 2. Clear
    def clear_db(tx):
        tx.run("MATCH (n) DETACH DELETE n")

    with driver.session() as session:
        session.execute_write(clear_db)
        
    # 3. Apply constraints
    with open("scripts/init_schema.cypher") as f:
        schema = f.read()
    with driver.session() as session:
        for stmt in schema.split(";"):
            if stmt.strip():
                session.run(stmt.strip())
                
    SUPPLIERS = [
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

    KITCHENS = []
    cities = [("Delhi", 28.6, 77.2), ("Gurugram", 28.45, 77.02), ("Noida", 28.53, 77.39), ("Ghaziabad", 28.67, 77.45), ("Faridabad", 28.41, 77.31)]
    for i in range(25):
        c, lat, lng = cities[i % 5]
        KITCHENS.append({
            'id': f'K{i+1:03d}',
            'name': f'Kitchen Hub {i+1}',
            'city': c,
            'lat': lat + random.uniform(-0.02, 0.02),
            'lng': lng + random.uniform(-0.02, 0.02)
        })

    HERO_BATCHES = [
        {'id': 'B_PNR2047', 'code': 'PNR-2047', 'ingredient': 'Paneer', 'qty_kg': 420.0,
         'received_at': '2026-09-18T06:00:00', 'expiry': '2026-09-25T00:00:00',
         'status': 'CRITICAL', 'supplier_id': 'S001'},
        {'id': 'B_VEG9182', 'code': 'VEG-9182', 'ingredient': 'Spinach', 'qty_kg': 180.0,
         'received_at': '2026-09-17T08:00:00', 'expiry': '2026-09-22T00:00:00',
         'status': 'MONITORING', 'supplier_id': 'S002'},
        {'id': 'B_MILK774', 'code': 'MILK-774', 'ingredient': 'Full Cream Milk', 'qty_kg': 600.0,
         'received_at': '2026-09-15T07:00:00', 'expiry': '2026-09-20T00:00:00',
         'status': 'RESOLVED', 'supplier_id': 'S001'},
    ]

    INGREDIENTS = ['Chicken', 'Tomatoes', 'Onions', 'Rice', 'Wheat Flour', 'Lentils', 'Oil', 'Garam Masala', 'Turmeric', 'Coriander', 'Ghee', 'Cardamom']
    OTHER_BATCHES = []
    for i in range(397):
        sup = random.choice(SUPPLIERS)['id']
        OTHER_BATCHES.append({
            'id': f'B_BATCH{i:04d}', 'code': f'BATCH-{i:04d}', 'ingredient': random.choice(INGREDIENTS),
            'qty_kg': round(random.uniform(50.0, 500.0), 1),
            'received_at': '2026-09-10T00:00:00', 'expiry': '2026-09-30T00:00:00',
            'status': 'NORMAL' if random.random() > 0.1 else 'MONITORING',
            'supplier_id': sup
        })
    BATCHES = HERO_BATCHES + OTHER_BATCHES

    # Write Suppliers
    with driver.session() as session:
        session.run("UNWIND $props AS props CREATE (s:Supplier) SET s = props", props=SUPPLIERS)
        session.run("UNWIND $props AS props CREATE (k:Kitchen) SET k = props", props=KITCHENS)

        # Write Batches
        session.run('''
        UNWIND $props AS props
        MATCH (s:Supplier {id: props.supplier_id})
        CREATE (b:IngredientBatch {id: props.id, code: props.code, ingredient: props.ingredient, qty_kg: props.qty_kg, received_at: props.received_at, expiry: props.expiry, status: props.status})
        CREATE (s)-[:SUPPLIED]->(b)
        ''', props=BATCHES)

    # Hero Scenario
    prep_lots = []
    dishes = []
    orders = []
    customers = []
    complaints = []

    cust_counter = 1
    order_counter = 1

    # PNR-2047 prep lots
    for i in range(31):
        pl_id = f"PL_PNR_{i}"
        kitchen = f"K{(i%12)+1:03d}"
        prep_lots.append({'id': pl_id, 'batch_id': 'B_PNR2047', 'kitchen_id': kitchen})
        for j in range(random.randint(1, 2)):
            dish_id = f"D_{pl_id}_{j}"
            dishes.append({'id': dish_id, 'prep_lot_id': pl_id})
            for k in range(random.randint(2, 4)):
                o_id = f"O_{dish_id}_{k}"
                c_id = f"C_{cust_counter}"
                customers.append({'id': c_id, 'name': f"Customer {cust_counter}"})
                orders.append({'id': o_id, 'dish_id': dish_id, 'customer_id': c_id, 'placed_at': '2026-09-19T10:00:00'})
                cust_counter += 1
                order_counter += 1

    # 3 hero complaints
    for i in range(3):
        comp_id = f"COMP_HERO_{i}"
        complaints.append({'id': comp_id, 'order_id': orders[i]['id'], 'text': 'Food poisoning symptoms after eating paneer', 'severity': 'HIGH', 'created_at': '2026-09-19T11:00:00'})

    # Bulk data
    bulk_pl_counter = 1
    bulk_dish_counter = 1
    for i in range(1500):
        pl_id = f"PL_BULK_{bulk_pl_counter}"
        b = random.choice(OTHER_BATCHES)['id']
        k = random.choice(KITCHENS)['id']
        prep_lots.append({'id': pl_id, 'batch_id': b, 'kitchen_id': k})
        bulk_pl_counter += 1

    for i in range(3000):
        dish_id = f"D_BULK_{bulk_dish_counter}"
        pl = random.choice(prep_lots)['id']
        dishes.append({'id': dish_id, 'prep_lot_id': pl})
        bulk_dish_counter += 1

    for i in range(4000):
        customers.append({'id': f"C_{cust_counter}", 'name': f"Customer {cust_counter}"})
        cust_counter += 1

    for i in range(10000):
        o_id = f"O_BULK_{order_counter}"
        d = random.choice(dishes)['id']
        c = random.choice(customers)['id']
        orders.append({'id': o_id, 'dish_id': d, 'customer_id': c, 'placed_at': '2026-09-19T10:00:00'})
        order_counter += 1

    for i in range(50):
        comp_id = f"COMP_BULK_{i}"
        o = random.choice(orders)['id']
        complaints.append({'id': comp_id, 'order_id': o, 'text': 'Generic complaint', 'severity': 'LOW', 'created_at': '2026-09-19T11:00:00'})

    # Write PrepLots
    with driver.session() as session:
        for b in range(0, len(prep_lots), 1000):
            session.run('''
            UNWIND $props AS p
            MATCH (b:IngredientBatch {id: p.batch_id}), (k:Kitchen {id: p.kitchen_id})
            CREATE (pl:PrepLot {id: p.id})
            CREATE (b)-[:USED_IN]->(pl)
            CREATE (pl)-[:PREPARED_AT]->(k)
            ''', props=prep_lots[b:b+1000])

        for b in range(0, len(dishes), 1000):
            session.run('''
            UNWIND $props AS d
            MATCH (pl:PrepLot {id: d.prep_lot_id})
            CREATE (dish:Dish {id: d.id})
            CREATE (pl)-[:MADE_INTO]->(dish)
            ''', props=dishes[b:b+1000])

        for b in range(0, len(customers), 1000):
            session.run('''
            UNWIND $props AS c
            CREATE (cust:Customer {id: c.id, name: c.name})
            ''', props=customers[b:b+1000])

        for b in range(0, len(orders), 1000):
            session.run('''
            UNWIND $props AS o
            MATCH (d:Dish {id: o.dish_id}), (c:Customer {id: o.customer_id})
            CREATE (ord:Order {id: o.id, placed_at: o.placed_at})
            CREATE (d)-[:SOLD_IN]->(ord)
            CREATE (ord)-[:PLACED_BY]->(c)
            ''', props=orders[b:b+1000])

        for b in range(0, len(complaints), 1000):
            session.run('''
            UNWIND $props AS c
            MATCH (o:Order {id: c.order_id})
            CREATE (comp:Complaint {id: c.id, text: c.text, severity: c.severity, created_at: c.created_at})
            CREATE (comp)-[:ABOUT]->(o)
            ''', props=complaints[b:b+1000])

        # TempReadings
        temps = []
        for b in HERO_BATCHES:
            for i in range(7):
                temp = random.uniform(2.0, 8.0)
                if b['id'] == 'B_PNR2047' and i == 3: temp = 14.2
                temps.append({'batch_id': b['id'], 'ts': f'2026-09-18T0{i+1}:00:00', 'celsius': round(temp, 1)})
        session.run('''
        UNWIND $props AS t
        MATCH (b:IngredientBatch {id: t.batch_id})
        CREATE (tr:TempReading {ts: t.ts, celsius: t.celsius})
        CREATE (b)-[:HAS_TEMP]->(tr)
        ''', props=temps)

        # Count check
        res = session.run("MATCH (n) RETURN count(n) AS cnt").single()
        node_cnt = res['cnt']
        res = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt").single()
        rel_cnt = res['cnt']
        print(f"Nodes: {node_cnt}, Relationships: {rel_cnt}")
        if node_cnt > 40000 or rel_cnt > 120000:
            print("Graph too large!")
            sys.exit(1)

    driver.close()

if __name__ == '__main__':
    main()
