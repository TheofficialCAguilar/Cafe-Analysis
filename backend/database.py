"""
database.py
Loads coffee-shop-sales-revenue.csv into a SQLite database.
Run this once before starting the FastAPI server:
    python3 database.py
"""

import sqlite3
import pandas as pd
import os

DB_PATH  = "coffee_shop.db"
CSV_PATH = "../data/coffee-shop-sales-revenue.csv"

def create_database():
    print("Loading CSV...")
    df = pd.read_csv(CSV_PATH, sep="|", parse_dates=["transaction_date"])

    #Derived columns 
    df["revenue"]      = df["transaction_qty"] * df["unit_price"]
    df["hour"]         = pd.to_datetime(df["transaction_time"], format="%H:%M:%S").dt.hour
    df["day_of_week"]  = df["transaction_date"].dt.day_name()
    df["month"]        = df["transaction_date"].dt.month
    df["month_name"]   = df["transaction_date"].dt.strftime("%B")

    print(f"  {len(df):,} rows loaded")
    print(f"  Columns: {df.columns.tolist()}")

    #SQLite 
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("sales", conn, if_exists="replace", index=False)

    #Indexes for fast queries 
    cursor = conn.cursor()
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_location ON sales(store_location)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_category ON sales(product_category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_date     ON sales(transaction_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hour     ON sales(hour)")
    conn.commit()
    conn.close()

    print(f"  Database saved to {DB_PATH}")
    print("Done.")

if __name__ == "__main__":
    create_database()