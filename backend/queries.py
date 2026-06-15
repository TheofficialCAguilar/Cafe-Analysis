"""
queries.py
All SQL queries as Python functions.
Each returns a list of dicts ready for FastAPI to serialize as JSON.
"""

import sqlite3

DB_PATH = "coffee_shop.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  
    return conn


#Overview stats 

def get_overview(location: str = None) -> dict:
    """Total revenue, total transactions, avg order value, top product."""
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    row = conn.execute(f"""
        SELECT
            ROUND(SUM(revenue), 2)          AS total_revenue,
            COUNT(DISTINCT transaction_id)  AS total_transactions,
            ROUND(AVG(revenue), 2)          AS avg_order_value,
            SUM(transaction_qty)            AS total_items_sold
        FROM sales {where}
    """, params).fetchone()

    top = conn.execute(f"""
        SELECT product_detail, SUM(transaction_qty) AS qty
        FROM sales {where}
        GROUP BY product_detail
        ORDER BY qty DESC LIMIT 1
    """, params).fetchone()

    conn.close()
    return {
        "total_revenue":       row["total_revenue"],
        "total_transactions":  row["total_transactions"],
        "avg_order_value":     row["avg_order_value"],
        "total_items_sold":    row["total_items_sold"],
        "top_product":         top["product_detail"] if top else None,
    }


#Top products 

def get_top_products(location: str = None, limit: int = 10) -> list:
    """Best selling products by quantity and revenue."""
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    rows = conn.execute(f"""
        SELECT
            product_detail,
            product_category,
            product_type,
            SUM(transaction_qty)   AS total_qty,
            ROUND(SUM(revenue), 2) AS total_revenue
        FROM sales {where}
        GROUP BY product_detail
        ORDER BY total_qty DESC
        LIMIT ?
    """, (*params, limit)).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Peak hours 

def get_peak_hours(location: str = None) -> list:
    """Average daily transactions and revenue per hour of day."""
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    #counts unique days in the dataset to compute daily average
    days_row = conn.execute(f"""
        SELECT COUNT(DISTINCT transaction_date) AS total_days
        FROM sales {where}
    """, params).fetchone()
    total_days = days_row["total_days"] or 1

    rows = conn.execute(f"""
        SELECT
            hour,
            ROUND(COUNT(*) * 1.0 / ?, 1)          AS avg_transactions,
            ROUND(SUM(revenue) / ?, 2)             AS avg_revenue
        FROM sales {where}
        GROUP BY hour
        ORDER BY hour
    """, (total_days, total_days, *params)).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Rev by location

def get_revenue_by_location() -> list:
    """Revenue, transactions, and top product per location."""
    conn = get_conn()

    rows = conn.execute("""
        SELECT
            store_location,
            ROUND(SUM(revenue), 2)         AS total_revenue,
            COUNT(DISTINCT transaction_id) AS total_transactions,
            ROUND(AVG(revenue), 2)         AS avg_order_value
        FROM sales
        GROUP BY store_location
        ORDER BY total_revenue DESC
    """).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Rev by month 

def get_revenue_by_month(location: str = None) -> list:
    """Monthly revenue trend."""
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    rows = conn.execute(f"""
        SELECT
            month,
            month_name,
            ROUND(SUM(revenue), 2)         AS revenue,
            COUNT(DISTINCT transaction_id) AS transactions
        FROM sales {where}
        GROUP BY month
        ORDER BY month
    """, params).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Rev by day of week 

def get_revenue_by_day(location: str = None) -> list:
    """Average revenue per day of week (Mon–Sun)."""
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    day_order = "CASE day_of_week "\
                "WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 "\
                "WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 "\
                "WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 "\
                "WHEN 'Sunday' THEN 7 END"

    rows = conn.execute(f"""
        SELECT
            day_of_week,
            COUNT(*)               AS transactions,
            ROUND(SUM(revenue), 2) AS total_revenue,
            ROUND(AVG(revenue), 2) AS avg_revenue
        FROM sales {where}
        GROUP BY day_of_week
        ORDER BY {day_order}
    """, params).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Revenue by category 

def get_revenue_by_category(location: str = None) -> list:
    """Revenue breakdown by product category."""
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    rows = conn.execute(f"""
        SELECT
            CASE product_category
                WHEN 'Coffee beans' THEN 'Coffee Beans'
                ELSE product_category
            END AS product_category,
            SUM(transaction_qty)   AS total_qty,
            ROUND(SUM(revenue), 2) AS total_revenue
        FROM sales {where}
        GROUP BY product_category
        ORDER BY total_revenue DESC
    """, params).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Popular right now (by hour)

def get_popular_by_hour(hour: int, location: str = None) -> list:
    """What sells most during a specific hour — for the customer-facing view."""
    conn = get_conn()
    where = "WHERE hour = ?"
    params = [hour]
    if location:
        where += " AND store_location = ?"
        params.append(location)

    rows = conn.execute(f"""
        SELECT
            product_detail,
            product_category,
            SUM(transaction_qty)   AS total_qty,
            ROUND(AVG(unit_price), 2) AS avg_price
        FROM sales {where}
        GROUP BY product_detail
        ORDER BY total_qty DESC
        LIMIT 10
    """, params).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Week over week comparison 

def get_week_over_week(location: str = None) -> dict:
    """
    Compares the last 7 days of data vs the 7 days before that.
    Returns revenue, transactions, and avg order value with % change.
    """
    conn = get_conn()
    where = "WHERE store_location = ?" if location else ""
    params = (location,) if location else ()

    # Get the latest date in the dataset
    latest = conn.execute(f"""
        SELECT MAX(transaction_date) AS latest FROM sales {where}
    """, params).fetchone()["latest"]

    # Current week: last 7 days of data
    curr = conn.execute(f"""
        SELECT
            ROUND(SUM(revenue), 2)         AS revenue,
            COUNT(DISTINCT transaction_id) AS transactions,
            ROUND(AVG(revenue), 2)         AS avg_order
        FROM sales
        WHERE transaction_date > DATE(?, '-7 days')
        {('AND store_location = ?' if location else '')}
    """, (latest, location) if location else (latest,)).fetchone()

    # Previous week: 7–14 days before latest
    prev = conn.execute(f"""
        SELECT
            ROUND(SUM(revenue), 2)         AS revenue,
            COUNT(DISTINCT transaction_id) AS transactions,
            ROUND(AVG(revenue), 2)         AS avg_order
        FROM sales
        WHERE transaction_date > DATE(?, '-14 days')
          AND transaction_date <= DATE(?, '-7 days')
        {('AND store_location = ?' if location else '')}
    """, (latest, latest, location) if location else (latest, latest)).fetchone()

    def pct_change(curr_val, prev_val):
        if not prev_val or prev_val == 0:
            return 0
        return round(((curr_val - prev_val) / prev_val) * 100, 1)

    conn.close()
    return {
        "period":              "Last 7 days vs prior 7 days",
        "latest_date":         latest,
        "current": {
            "revenue":      curr["revenue"]      or 0,
            "transactions": curr["transactions"] or 0,
            "avg_order":    curr["avg_order"]    or 0,
        },
        "previous": {
            "revenue":      prev["revenue"]      or 0,
            "transactions": prev["transactions"] or 0,
            "avg_order":    prev["avg_order"]    or 0,
        },
        "changes": {
            "revenue":      pct_change(curr["revenue"]      or 0, prev["revenue"]      or 0),
            "transactions": pct_change(curr["transactions"] or 0, prev["transactions"] or 0),
            "avg_order":    pct_change(curr["avg_order"]    or 0, prev["avg_order"]    or 0),
        }
    }


def get_location_comparison() -> list:
    """Side by side hourly traffic for all 3 locations."""
    conn = get_conn()

    rows = conn.execute("""
        SELECT
            store_location,
            hour,
            COUNT(*) AS transactions
        FROM sales
        GROUP BY store_location, hour
        ORDER BY store_location, hour
    """).fetchall()

    conn.close()
    return [dict(r) for r in rows]


#Category benchmark (for MyMenu comparison) 

def get_category_benchmark(category: str) -> dict:
    """Avg daily sales, avg price, peak hour, and best day for a category."""
    conn = get_conn()

    days_row = conn.execute(
        "SELECT COUNT(DISTINCT transaction_date) AS d FROM sales"
    ).fetchone()
    total_days = days_row["d"] or 1

    row = conn.execute("""
        SELECT
            ROUND(SUM(transaction_qty) * 1.0 / ?, 1) AS avg_daily_qty,
            ROUND(AVG(unit_price), 2)                 AS avg_price,
            ROUND(SUM(revenue) / ?, 2)                AS avg_daily_revenue
        FROM sales
        WHERE product_category = ?
    """, (total_days, total_days, category)).fetchone()

    peak = conn.execute("""
        SELECT hour, COUNT(*) AS cnt
        FROM sales
        WHERE product_category = ?
        GROUP BY hour
        ORDER BY cnt DESC LIMIT 1
    """, (category,)).fetchone()

    best_day = conn.execute("""
        SELECT day_of_week, COUNT(*) AS cnt
        FROM sales
        WHERE product_category = ?
        GROUP BY day_of_week
        ORDER BY cnt DESC LIMIT 1
    """, (category,)).fetchone()

    conn.close()
    return {
        "category":          category,
        "avg_daily_qty":     row["avg_daily_qty"]     if row else 0,
        "avg_price":         row["avg_price"]          if row else 0,
        "avg_daily_revenue": row["avg_daily_revenue"]  if row else 0,
        "peak_hour":         peak["hour"]              if peak else 9,
        "best_day":          best_day["day_of_week"]   if best_day else "Friday",
    }