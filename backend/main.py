from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import queries

app = FastAPI(
    title="Cafe Analysis API",
    description="NYC Coffee Shop Sales Analytics — Carlos Aguilar",
    version="1.0.0"
)

#CORS allows React frontend to talk to this API 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

#locations
LOCATIONS = ["Astoria", "Hell's Kitchen", "Lower Manhattan"]


def validate_location(location: Optional[str]) -> Optional[str]:
    if location and location not in LOCATIONS:
        return None
    return location


#Routes

@app.get("/")
def root():
    return {
        "message": "Cafe Analysis API",
        "endpoints": [
            "/overview",
            "/top-products",
            "/peak-hours",
            "/revenue-by-location",
            "/revenue-by-month",
            "/revenue-by-day",
            "/revenue-by-category",
            "/popular-by-hour",
            "/location-comparison",
        ]
    }


@app.get("/overview")
def overview(location: Optional[str] = Query(None, description="Filter by location")):
    """
    Key stats: total revenue, transactions, avg order value, top product.
    Optional ?location=Astoria
    """
    loc = validate_location(location)
    return queries.get_overview(loc)


@app.get("/top-products")
def top_products(
    location: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """Best selling products by quantity. Optional location filter."""
    loc = validate_location(location)
    return queries.get_top_products(loc, limit)


@app.get("/peak-hours")
def peak_hours(location: Optional[str] = Query(None)):
    """Transaction count and revenue per hour of day."""
    loc = validate_location(location)
    return queries.get_peak_hours(loc)


@app.get("/revenue-by-location")
def revenue_by_location():
    """Revenue, transactions, and avg order value per NYC location."""
    return queries.get_revenue_by_location()


@app.get("/revenue-by-month")
def revenue_by_month(location: Optional[str] = Query(None)):
    """Monthly revenue trend Jan–Jun 2023."""
    loc = validate_location(location)
    return queries.get_revenue_by_month(loc)


@app.get("/revenue-by-day")
def revenue_by_day(location: Optional[str] = Query(None)):
    """Revenue and transaction count by day of week."""
    loc = validate_location(location)
    return queries.get_revenue_by_day(loc)


@app.get("/revenue-by-category")
def revenue_by_category(location: Optional[str] = Query(None)):
    """Revenue breakdown by product category (Coffee, Tea, Bakery, etc)."""
    loc = validate_location(location)
    return queries.get_revenue_by_category(loc)


@app.get("/popular-by-hour")
def popular_by_hour(
    hour: int = Query(..., ge=0, le=23, description="Hour 0-23"),
    location: Optional[str] = Query(None)
):
    """
    What's most popular during a specific hour.
    Customer-facing endpoint: 'What should I order at 8am in Astoria?'
    Example: /popular-by-hour?hour=8&location=Astoria
    """
    loc = validate_location(location)
    return queries.get_popular_by_hour(hour, loc)


@app.get("/location-comparison")
def location_comparison():
    """Hourly traffic for all 3 locations side by side."""
    return queries.get_location_comparison()


@app.get("/category-benchmark")
def category_benchmark(category: str = Query(..., description="Product category name")):
    """
    Avg daily qty, avg price, peak hour and best day for a category.
    Used by the MyMenu feature to compare custom drinks to real NYC data.
    Example: /category-benchmark?category=Coffee
    """
    return queries.get_category_benchmark(category)


@app.get("/week-over-week")
def week_over_week(location: Optional[str] = Query(None)):
    """
    Revenue, transactions, and avg order value for the last 7 days
    vs the prior 7 days — with % change for each metric.
    """
    loc = validate_location(location)
    return queries.get_week_over_week(loc)


@app.get("/locations")
def locations():
    """List of all available store locations."""
    return {"locations": LOCATIONS}