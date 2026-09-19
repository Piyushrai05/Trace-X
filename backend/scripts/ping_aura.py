import os
import time
from dotenv import load_dotenv
from neo4j import GraphDatabase

def main():
    load_dotenv()
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USERNAME")
    password = os.getenv("NEO4J_PASSWORD")
    
    driver = GraphDatabase.driver(uri, auth=(user, password))
    try:
        driver.verify_connectivity()
        start = time.monotonic()
        with driver.session() as session:
            session.run("RETURN 1").single()
        elapsed = round((time.monotonic() - start) * 1000, 2)
        print(f"Aura DB Ping Latency: {elapsed} ms")
    finally:
        driver.close()

if __name__ == "__main__":
    main()
