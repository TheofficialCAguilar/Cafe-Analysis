import { useState, useEffect } from "react";
import { api } from "../hooks/useApi";
import { COLORS } from "../theme";

const LOCATIONS = ["Astoria", "Hell's Kitchen", "Lower Manhattan"];
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CustomerView() {
  const [hour, setHour]           = useState(8);
  const [location, setLocation]   = useState("Astoria");
  const [popular, setPopular]     = useState([]);

  useEffect(() => {
    api.get("/popular-by-hour", { params: { hour, location } })
      .then(r => setPopular(r.data));
  }, [hour, location]);

  const timeLabel = h => {
    if (h === 0)  return "12:00 AM";
    if (h < 12)   return `${h}:00 AM`;
    if (h === 12) return "12:00 PM";
    return `${h - 12}:00 PM`;
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

      {/*Hero*/}
      <div style={{ textAlign: "center", padding: "2rem 0 1.5rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f0f0f0" }}>
          What's flying off the counter?
        </h2>
        <p style={{ color: "#555", margin: 0 }}>
          Real orders from real NYC cafes. Pick a spot and a time — see what people are actually drinking.
        </p>
      </div>

      {/*Controls*/}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem",
                    background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px",
                    padding: "1.5rem", marginBottom: "2rem" }}>
        {/*Location*/}
        <div>
          <p style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase",
                      letterSpacing: "0.12em", marginBottom: "0.75rem" }}>Location</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {LOCATIONS.map(l => (
              <button key={l} onClick={() => setLocation(l)} style={{
                padding: "0.5rem 1rem",
                border: `1px solid ${location === l ? "#22d3ee" : "#2a2a2a"}`,
                borderRadius: "6px",
                background: location === l ? "rgba(34,211,238,0.1)" : "transparent",
                color: location === l ? "#22d3ee" : "#666",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.85rem",
                fontWeight: location === l ? 600 : 400,
                transition: "all 0.15s",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/*Time slider*/}
        <div>
          <p style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase",
                      letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
            Time of Day
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#f0f0f0",
                      margin: "0 0 1rem" }}>{timeLabel(hour)}</p>
          <input type="range" min={6} max={20} value={hour}
                 onChange={e => setHour(Number(e.target.value))}
                 style={{ width: "100%", accentColor: "#6366f1" }} />
          <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: "0.72rem", color: "#444", marginTop: "0.25rem" }}>
            <span>6 AM</span><span>12 PM</span><span>8 PM</span>
          </div>
        </div>
      </div>

      {/*Results*/}
      <p style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase",
                  letterSpacing: "0.12em", marginBottom: "1rem" }}>
        Right now at {location} · {timeLabel(hour)}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                    gap: "1rem" }}>
        {popular.slice(0, 6).map((item, i) => (
          <div key={i} style={{
            background: "#111",
            border: `1px solid #1e1e1e`,
            borderTop: `3px solid ${COLORS[i % COLORS.length]}`,
            borderRadius: "10px",
            padding: "1.25rem",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "0.75rem", right: "0.75rem",
              background: COLORS[i % COLORS.length], borderRadius: "20px",
              padding: "0.1rem 0.45rem", fontSize: "0.7rem", fontWeight: 700, color: "#000"
            }}>#{i + 1}</div>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.2rem",
                        paddingRight: "2rem", color: "#f0f0f0" }}>{item.product_detail}</p>
            <p style={{ fontSize: "0.72rem", color: "#555", margin: "0 0 0.75rem" }}>
              {item.product_category}
            </p>
            <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#22d3ee",
                        margin: "0 0 0.2rem" }}>${item.avg_price}</p>
            <p style={{ fontSize: "0.7rem", color: "#444", margin: 0 }}>
              {item.total_qty?.toLocaleString()} sold at this hour
            </p>
          </div>
        ))}
      </div>

      {popular.length === 0 && (
        <p style={{ color: "#333", textAlign: "center", padding: "3rem" }}>
          No data for this hour — try a different time.
        </p>
      )}
    </div>
  );
}