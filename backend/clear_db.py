"""
Script to clear all data from the database.
Run with: python clear_db.py

WARNING: This will delete ALL data from the database!
"""
import os
from sqlalchemy import create_engine, text

# Get database URL from environment or use local default
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set.")
    print("Set it to your Neon database URL, e.g.:")
    print('  export DATABASE_URL="postgresql://user:password@host/database?sslmode=require"')
    exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

TABLES_IN_ORDER = [
    "child_badges",
    "reward_redemptions",
    "points_ledger",
    "submissions",
    "tasks",
    "parent_settings",
    "rewards",
    "badges",
    "users",
]

with engine.connect() as conn:
    for table in TABLES_IN_ORDER:
        try:
            result = conn.execute(text(f"DELETE FROM {table}"))
            conn.commit()
            print(f"✓ Deleted all rows from {table}")
        except Exception as e:
            print(f"✗ Error deleting from {table}: {e}")

print("\nDatabase cleared successfully!")
