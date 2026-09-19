import csv
import os
import random
from datetime import datetime, timedelta

def generate_csv_data(output_dir: str = "data"):
    os.makedirs(output_dir, exist_ok=True)
    random.seed(42)

    # 1. Suppliers
    suppliers = [
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
    with open(os.path.join(output_dir, 'suppliers.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'name', 'city', 'category'])
        writer.writeheader()
        writer.writerows(suppliers)

    # 2. Kitchens (25 across Delhi NCR)
    cities = [
        ('Delhi', 28.6139, 77.2090),
        ('Gurugram', 28.4595, 77.0266),
        ('Noida', 28.5355, 77.3910),
        ('Ghaziabad', 28.6692, 77.4538),
        ('Faridabad', 28.4089, 77.3178),
    ]
    kitchens = []
    for i in range(25):
        c, lat, lng = cities[i % 5]
        kitchens.append({
            'id': f'K{i+1:03d}',
            'name': f'Kitchen Hub {i+1}',
            'city': c,
            'lat': round(lat + random.uniform(-0.02, 0.02), 6),
            'lng': round(lng + random.uniform(-0.02, 0.02), 6),
        })
    with open(os.path.join(output_dir, 'kitchens.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'name', 'city', 'lat', 'lng'])
        writer.writeheader()
        writer.writerows(kitchens)

    # 3. Batches (400 batches: Hero batches + bulk)
    batches = [
        {
            'id': 'B_PNR2047',
            'code': 'PNR-2047',
            'ingredient': 'Paneer',
            'qty_kg': 420.0,
            'received_at': '2026-09-18T06:00:00',
            'expiry': '2026-09-25T00:00:00',
            'status': 'CRITICAL',
            'supplier_id': 'S001',
        },
        {
            'id': 'B_VEG9182',
            'code': 'VEG-9182',
            'ingredient': 'Spinach',
            'qty_kg': 180.0,
            'received_at': '2026-09-17T08:00:00',
            'expiry': '2026-09-22T00:00:00',
            'status': 'MONITORING',
            'supplier_id': 'S002',
        },
        {
            'id': 'B_MILK774',
            'code': 'MILK-774',
            'ingredient': 'Full Cream Milk',
            'qty_kg': 600.0,
            'received_at': '2026-09-15T07:00:00',
            'expiry': '2026-09-20T00:00:00',
            'status': 'RESOLVED',
            'supplier_id': 'S001',
        },
    ]
    ingredients = ['Chicken', 'Tomatoes', 'Onions', 'Rice', 'Wheat Flour', 'Lentils', 'Oil', 'Garam Masala', 'Turmeric', 'Coriander', 'Ghee', 'Cardamom']
    for i in range(397):
        sup = random.choice(suppliers)['id']
        batches.append({
            'id': f'B_BATCH{i:04d}',
            'code': f'BATCH-{i:04d}',
            'ingredient': random.choice(ingredients),
            'qty_kg': round(random.uniform(50.0, 500.0), 1),
            'received_at': '2026-09-10T00:00:00',
            'expiry': '2026-09-30T00:00:00',
            'status': 'NORMAL' if random.random() > 0.08 else 'MONITORING',
            'supplier_id': sup,
        })
    with open(os.path.join(output_dir, 'ingredient_batches.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'code', 'ingredient', 'qty_kg', 'received_at', 'expiry', 'status', 'supplier_id'])
        writer.writeheader()
        writer.writerows(batches)

    # 4. Temperature Readings (Cold Chain Logs)
    temps = []
    for b in batches[:3]: # Hero batches
        for h in range(8):
            celsius = round(random.uniform(3.5, 6.8), 1)
            if b['code'] == 'PNR-2047' and h == 3:
                celsius = 14.2 # Breach
            temps.append({
                'batch_id': b['id'],
                'ts': f'2026-09-18T{h+6:02d}:00:00',
                'celsius': celsius,
            })
    with open(os.path.join(output_dir, 'temp_readings.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['batch_id', 'ts', 'celsius'])
        writer.writeheader()
        writer.writerows(temps)

    # 5. Prep Lots, Dishes, Orders, Customers, Complaints
    prep_lots = []
    dishes = []
    orders = []
    customers = []
    complaints = []

    cust_counter = 1
    order_counter = 1

    # Plant Hero scenario: PNR-2047 -> 31 prep lots across 12 kitchens -> 47 dishes -> 1842 orders -> 2913 customers
    # 31 prep lots for PNR-2047
    pnr_prep_lots = []
    for i in range(31):
        pl_id = f"PL_PNR_{i+1:03d}"
        kitchen = f"K{(i % 12) + 1:03d}" # Spans 12 kitchens
        prep_lot_obj = {'id': pl_id, 'batch_id': 'B_PNR2047', 'kitchen_id': kitchen}
        prep_lots.append(prep_lot_obj)
        pnr_prep_lots.append(prep_lot_obj)

    # 47 dishes distributed across the 31 prep lots
    pnr_dishes = []
    for i in range(47):
        pl = pnr_prep_lots[i % len(pnr_prep_lots)]
        dish_id = f"DISH_PNR_{i+1:03d}"
        dish_obj = {'id': dish_id, 'prep_lot_id': pl['id']}
        dishes.append(dish_obj)
        pnr_dishes.append(dish_obj)

    # 2913 customers for PNR scenario
    pnr_customers = []
    for i in range(2913):
        c_id = f"CUST_{cust_counter:05d}"
        cust_obj = {'id': c_id, 'name': f"Customer {cust_counter}"}
        customers.append(cust_obj)
        pnr_customers.append(cust_obj)
        cust_counter += 1

    # 1842 orders for PNR scenario
    pnr_orders = []
    for i in range(1842):
        d = pnr_dishes[i % len(pnr_dishes)]
        c = pnr_customers[i % len(pnr_customers)]
        o_id = f"ORD_PNR_{order_counter:05d}"
        order_obj = {
            'id': o_id,
            'dish_id': d['id'],
            'customer_id': c['id'],
            'placed_at': (datetime(2026, 9, 18, 12, 0) + timedelta(minutes=i*2)).isoformat(),
        }
        orders.append(order_obj)
        pnr_orders.append(order_obj)
        order_counter += 1

    # Plant 3 hero complaints converging on PNR-2047
    complaints.append({
        'id': 'COMP-001',
        'order_id': pnr_orders[0]['id'],
        'text': 'Severe food poisoning and cramps after eating Paneer Tikka (Order ORD-4081)',
        'severity': 'CRITICAL',
        'created_at': '2026-09-19T09:15:00',
    })
    complaints.append({
        'id': 'COMP-002',
        'order_id': pnr_orders[1]['id'],
        'text': 'Acute stomach upset and nausea following Shahi Paneer dinner (Order ORD-4082)',
        'severity': 'CRITICAL',
        'created_at': '2026-09-19T10:30:00',
    })
    complaints.append({
        'id': 'COMP-003',
        'order_id': pnr_orders[2]['id'],
        'text': 'Hospitalized with gastroenteritis after Paneer Butter Masala meal (Order ORD-4083)',
        'severity': 'CRITICAL',
        'created_at': '2026-09-19T11:05:00',
    })

    # Bulk data to reach ~1,500 Prep Lots, ~3,000 Dishes, ~10,000 Orders, ~4,000 Customers, 50 Complaints
    remaining_batches = [b['id'] for b in batches if b['id'] != 'B_PNR2047']
    for i in range(1469): # 31 + 1469 = 1500 prep lots
        pl_id = f"PL_BULK_{i+1:04d}"
        b = random.choice(remaining_batches)
        k = random.choice(kitchens)['id']
        prep_lots.append({'id': pl_id, 'batch_id': b, 'kitchen_id': k})

    for i in range(2953): # 47 + 2953 = 3000 dishes
        d_id = f"DISH_BULK_{i+1:04d}"
        pl = random.choice(prep_lots)['id']
        dishes.append({'id': d_id, 'prep_lot_id': pl})

    for i in range(1087): # 2913 + 1087 = 4000 customers
        c_id = f"CUST_{cust_counter:05d}"
        customers.append({'id': c_id, 'name': f"Customer {cust_counter}"})
        cust_counter += 1

    for i in range(8158): # 1842 + 8158 = 10000 orders
        o_id = f"ORD_BULK_{order_counter:05d}"
        d = random.choice(dishes)['id']
        c = random.choice(customers)['id']
        orders.append({
            'id': o_id,
            'dish_id': d,
            'customer_id': c,
            'placed_at': (datetime(2026, 9, 10, 8, 0) + timedelta(minutes=random.randint(0, 12000))).isoformat(),
        })
        order_counter += 1

    for i in range(47): # 3 + 47 = 50 complaints
        c_id = f"COMP_{i+4:03d}"
        o = random.choice(orders)['id']
        complaints.append({
            'id': c_id,
            'order_id': o,
            'text': f'Quality and temperature concern reported for food order {o}',
            'severity': 'LOW' if random.random() > 0.3 else 'MEDIUM',
            'created_at': (datetime(2026, 9, 19, 6, 0) + timedelta(minutes=i*10)).isoformat(),
        })

    # Write CSV files
    with open(os.path.join(output_dir, 'prep_lots.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'batch_id', 'kitchen_id'])
        writer.writeheader()
        writer.writerows(prep_lots)

    with open(os.path.join(output_dir, 'dishes.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'prep_lot_id'])
        writer.writeheader()
        writer.writerows(dishes)

    with open(os.path.join(output_dir, 'customers.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'name'])
        writer.writeheader()
        writer.writerows(customers)

    with open(os.path.join(output_dir, 'orders.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'dish_id', 'customer_id', 'placed_at'])
        writer.writeheader()
        writer.writerows(orders)

    with open(os.path.join(output_dir, 'complaints.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'order_id', 'text', 'severity', 'created_at'])
        writer.writeheader()
        writer.writerows(complaints)

    print(f"Generated CSV files in '{output_dir}':")
    print(f"- suppliers.csv: {len(suppliers)} rows")
    print(f"- kitchens.csv: {len(kitchens)} rows")
    print(f"- ingredient_batches.csv: {len(batches)} rows")
    print(f"- temp_readings.csv: {len(temps)} rows")
    print(f"- prep_lots.csv: {len(prep_lots)} rows")
    print(f"- dishes.csv: {len(dishes)} rows")
    print(f"- customers.csv: {len(customers)} rows")
    print(f"- orders.csv: {len(orders)} rows")
    print(f"- complaints.csv: {len(complaints)} rows")
    total_nodes = len(suppliers) + len(kitchens) + len(batches) + len(temps) + len(prep_lots) + len(dishes) + len(customers) + len(orders) + len(complaints)
    print(f"Total Nodes Budget: {total_nodes} (< 40,000 limit OK)")

if __name__ == '__main__':
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else 'backend/data'
    generate_csv_data(target)
