import { useEffect, useState } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { ACCENT } from "../theme";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function ChangeArrow({ pct }) {
  if (pct === 0 || pct === null || pct === undefined) return null;
  const up    = pct > 0;
  const color = up ? "#4a7c59" : "#d4645a";
  return (
    <span style={{ fontSize: "0.7rem", color, fontWeight: 600,
                   display: "inline-flex", alignItems: "center", gap: "0.2rem",
                   marginLeft: "0.4rem" }}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
      <span style={{ fontWeight: 400, color: "#3a3028", fontSize: "0.65rem" }}>
        vs last week
      </span>
    </span>
  );
}


function StatCard({ label, rawValue, displayValue, sub, accent, change, delay }) {
  const isNumeric = typeof rawValue === "number" && !isNaN(rawValue);

  const animated = useCountUp(isNumeric ? rawValue : 0, 1400, delay);

  let formattedAnimated = displayValue;
  if (isNumeric && displayValue?.startsWith("$")) {
    formattedAnimated = `$${animated.toLocaleString("en-US")}`;
  } else if (isNumeric) {
    formattedAnimated = animated.toLocaleString("en-US");
  }

  return (
    <div
      style={{
        background: "#111",
        border: `1px solid #1e1a16`,
        borderTop: `3px solid ${accent}`,
        borderRadius: "8px",
        padding: "1.25rem",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "#161210";
        e.currentTarget.style.border = `1px solid ${accent}`;
        e.currentTarget.style.borderTop = `3px solid ${accent}`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
        e.currentTarget.querySelector(".stat-value").style.color = accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "#111";
        e.currentTarget.style.border = `1px solid #1e1a16`;
        e.currentTarget.style.borderTop = `3px solid ${accent}`;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.querySelector(".stat-value").style.color = "#f0ebe6";
      }}
    >
      <p style={{ fontSize: "0.68rem", color: "#555", textTransform: "uppercase",
                  letterSpacing: "0.12em", margin: "0 0 0.5rem" }}>{label}</p>
         <p className="stat-value"
         style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 0.2rem",
                  color: "#f0ebe6", letterSpacing: "-0.02em",
                  transition: "color 0.2s", lineHeight: 1 }}>
        {formattedAnimated}
      </p>
      

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap",
                    gap: "0.25rem", marginTop: "0.3rem" }}>
        {sub && <p style={{ fontSize: "0.68rem", color: "#3a3028", margin: 0 }}>{sub}</p>}
        {change !== undefined && <ChangeArrow pct={change} />}
      </div>
    </div>
  );
}

export default function StatCards({ overview, location }) {

  const [wow, setWow] = useState(null);

  useEffect(() => {
    const params = location && location !== "All" ? { location } : {};
    axios.get(`${API}/week-over-week`, { params })
      .then(r => setWow(r.data))
      .catch(() => setWow(null));
  }, [location]);


  if (!overview) return null;

  const revenue = overview.total_revenue      || 0;
  const txns    = overview.total_transactions || 0;
  const avg     = overview.avg_order_value    || 0;
  const items   = overview.total_items_sold   || 0;


  const cards = [
    {
      label:        "Money made",          
      rawValue:     revenue,
      displayValue: `$${revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub:          "Jan–Jun 2023",
      accent:       ACCENT.revenue,
      change:       wow?.changes?.revenue,  
      delay:        0,                      
    },
    {
      label:        "Customers served",     
      rawValue:     txns,
      displayValue: txns.toLocaleString(),
      sub:          "total visits",
      accent:       ACCENT.transactions,
      change:       wow?.changes?.transactions,
      delay:        100,                    
    },
    {
      label:        "Avg per visit",       
      rawValue:     avg,
      displayValue: `$${avg.toFixed(2)}`,
      sub:          "per transaction",
      accent:       ACCENT.avgOrder,
      change:       wow?.changes?.avg_order,
      delay:        200,
    },
    {
      label:        "Items out the door",  
      rawValue:     items,
      displayValue: items.toLocaleString(),
      sub:          "units sold",
      accent:       ACCENT.items,
      change:       null,
      delay:        300,
    },
    {
      label:        "Flying off the counter", 
      rawValue:     null,
      displayValue: overview.top_product,
      sub:          "most ordered item",
      accent:       ACCENT.topProduct,
      change:       null,
      delay:        400,                    
    },
  ];

  return (
    <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "1rem", marginBottom: "2rem" }}>
      {cards.map((c, i) => <StatCard key={i} {...c} />)}
    </div>
  );
}