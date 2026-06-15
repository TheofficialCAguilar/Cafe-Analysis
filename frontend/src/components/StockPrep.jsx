import { useState, useEffect } from "react";
import { api } from "../hooks/useApi";
import { COLORS } from "../theme";

const LOCATIONS = ["Astoria", "Hell's Kitchen", "Lower Manhattan"];

// How many units to stock per expected transaction
// Based on avg qty per transaction from the dataset
const STOCK_MULTIPLIER = 1.2; 

// Day labels
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// Staffing thresholds based on avg transactions per hour
function getStaffing(avgOrders) {
  if (avgOrders >= 80)  return { count: 4, label: "Very busy",  color: "#d4645a" };
  if (avgOrders >= 50)  return { count: 3, label: "Busy",       color: "#c8956c" };
  if (avgOrders >= 25)  return { count: 2, label: "Moderate",   color: "#e8c99a" };
  return                       { count: 1, label: "Quiet",      color: "#4a7c59" };
}

function timeLabel(h) {
  if (h === 0)  return "12:00 AM";
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export default function StockPrep() {
  const [location, setLocation]   = useState("Astoria");
  const [peakHours, setPeakHours] = useState([]);
  const [topByHour, setTopByHour] = useState({});
  const [byDay, setByDay]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/peak-hours",     { params: { location } }),
      api.get("/revenue-by-day", { params: { location } }),
    ]).then(([ph, bd]) => {
      setPeakHours(ph.data);
      setByDay(bd.data);
      setLoading(false);
    });
  }, [location]);

  // Fetch top 5 products for each busy hour (avg_transactions > 20)
  useEffect(() => {
    if (!peakHours.length) return;
    const busyHours = peakHours
      .filter(h => h.avg_transactions >= 20)
      .map(h => h.hour);

    Promise.all(
      busyHours.map(h =>
        api.get("/popular-by-hour", { params: { hour: h, location } })
           .then(r => ({ hour: h, products: r.data.slice(0, 5) }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.hour] = r.products; });
      setTopByHour(map);
    });
  }, [peakHours, location]);

  const maxOrders = Math.max(...peakHours.map(h => h.avg_transactions || 0), 1);
  const maxDayRev = Math.max(...byDay.map(d => d.total_revenue || 0), 1);

  // Find the 3 peak hours
  const top3Hours = [...peakHours]
    .sort((a, b) => b.avg_transactions - a.avg_transactions)
    .slice(0, 3);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

      {/*Hero*/}
      <div style={{ textAlign: "center", padding: "2rem 0 1.5rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f0ebe6" }}>
          Be ready before they walk in
        </h2>
        <p style={{ color: "#555", margin: "0 auto", maxWidth: "520px", fontSize: "0.9rem" }}>
          Stop guessing. This is what 149,000 real NYC cafe transactions say about when to stock up, how many hands you need, and what's going to sell.
        </p>
      </div>

      {/*Location selector*/}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center",
                    marginBottom: "2rem", flexWrap: "wrap" }}>
        {LOCATIONS.map(l => (
          <button key={l} onClick={() => setLocation(l)} style={{
            padding: "0.5rem 1.25rem",
            border: `1px solid ${location === l ? "#c8956c" : "#2a2218"}`,
            borderRadius: "20px",
            background: location === l ? "rgba(200,149,108,0.15)" : "transparent",
            color: location === l ? "#c8956c" : "#555",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: location === l ? 600 : 400,
            transition: "all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {loading && <p style={{ color: "#444", textAlign: "center", padding: "3rem" }}>Loading…</p>}

      {!loading && <>

        {/*Peak hour summary cards*/}
        <p style={sectionLabel}>Today's busiest windows</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "1rem", marginBottom: "2rem" }}>
          {top3Hours.map((h, i) => {
            const staff = getStaffing(h.avg_transactions);
            return (
              <div key={h.hour} style={{
                background: "#111",
                border: `1px solid #1e1e1e`,
                borderTop: `3px solid ${COLORS[i]}`,
                borderRadius: "8px",
                padding: "1.25rem",
              }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f0ebe6",
                            margin: "0 0 0.2rem" }}>{timeLabel(h.hour)}</p>
                <p style={{ fontSize: "0.75rem", color: "#555", margin: "0 0 1rem" }}>
                  Peak window #{i + 1}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between",
                              alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "#666" }}>Avg orders/hr</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700,
                                 color: COLORS[i] }}>{h.avg_transactions}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",
                              background: "#0f0f0f", borderRadius: "6px",
                              padding: "0.5rem 0.75rem" }}>
                  <span style={{ fontSize: "1rem" }}>👥</span>
                  <div>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: staff.color,
                                margin: 0 }}>{staff.label} — {staff.count} staff recommended</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/*Hourly traffic bar + stock guide*/}
        <p style={sectionLabel}>Hourly breakdown & what to stock</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem",
                      marginBottom: "2rem" }}>

          {/*Traffic bars*/}
          <div style={{ background: "#111", border: "1px solid #1e1e1e",
                        borderRadius: "8px", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#555", textTransform: "uppercase",
                        letterSpacing: "0.1em", margin: "0 0 1rem" }}>Traffic by hour</p>
            {peakHours.filter(h => h.hour >= 6 && h.hour <= 20).map(h => {
              const staff  = getStaffing(h.avg_transactions);
              const width  = ((h.avg_transactions / maxOrders) * 100).toFixed(1);
              return (
                <div key={h.hour} style={{ display: "flex", alignItems: "center",
                                           gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "#555",
                                 width: "44px", flexShrink: 0 }}>{timeLabel(h.hour)}</span>
                  <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "3px", height: "10px" }}>
                    <div style={{
                      width: `${width}%`,
                      background: staff.color,
                      height: "10px",
                      borderRadius: "3px",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#555",
                                 width: "28px", textAlign: "right",
                                 flexShrink: 0 }}>{h.avg_transactions}</span>
                </div>
              );
            })}
            {/*Legend*/}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem",
                          flexWrap: "wrap" }}>
              {[["#d4645a","Very busy (80+)"],["#c8956c","Busy (50–79)"],
                ["#e8c99a","Moderate (25–49)"],["#4a7c59","Quiet (<25)"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <div style={{ width: "8px", height: "8px", background: c,
                                borderRadius: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.65rem", color: "#555" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/*Stock guide per hour*/}
          <div style={{ background: "#111", border: "1px solid #1e1e1e",
                        borderRadius: "8px", padding: "1.25rem", overflowY: "auto",
                        maxHeight: "420px" }}>
            <p style={{ fontSize: "0.72rem", color: "#555", textTransform: "uppercase",
                        letterSpacing: "0.1em", margin: "0 0 1rem" }}>Stock up before each window</p>
            {Object.entries(topByHour)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([hour, products]) => (
                <div key={hour} style={{ marginBottom: "1.25rem" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#c8956c",
                              margin: "0 0 0.5rem" }}>{timeLabel(Number(hour))}</p>
                  {products.map((p, i) => {
                    const expected = Math.ceil(p.total_qty * STOCK_MULTIPLIER / 181);
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between",
                                            alignItems: "center", padding: "0.3rem 0",
                                            borderBottom: "1px solid #1a1a1a" }}>
                        <span style={{ fontSize: "0.78rem", color: "#888" }}>{p.product_detail}</span>
                        <span style={{ fontSize: "0.75rem", color: "#c8956c",
                                       fontWeight: 600, background: "rgba(200,149,108,0.1)",
                                       padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                          ~{expected} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            {Object.keys(topByHour).length === 0 && (
              <p style={{ color: "#333", fontSize: "0.8rem" }}>Loading stock data…</p>
            )}
          </div>
        </div>

        {/*Day of week guide*/}
        <p style={sectionLabel}>Prep by day of week</p>
        <div style={{ background: "#111", border: "1px solid #1e1e1e",
                      borderRadius: "8px", padding: "1.25rem", marginBottom: "2rem" }}>
          {DAYS.map(day => {
            const d = byDay.find(x => x.day_of_week === day);
            if (!d) return null;
            const width  = ((d.total_revenue / maxDayRev) * 100).toFixed(1);
            const staff  = getStaffing(d.transactions / 15);
            const isWeekend = day === "Saturday" || day === "Sunday";
            return (
              <div key={day} style={{ display: "flex", alignItems: "center",
                                      gap: "1rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.78rem", color: isWeekend ? "#c8956c" : "#666",
                               width: "90px", flexShrink: 0, fontWeight: isWeekend ? 600 : 400 }}>
                  {day.slice(0, 3)}
                  {isWeekend && <span style={{ fontSize: "0.6rem", color: "#c8956c",
                                               marginLeft: "0.3rem" }}>WKD</span>}
                </span>
                <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "3px", height: "10px" }}>
                  <div style={{
                    width: `${width}%`,
                    background: staff.color,
                    height: "10px", borderRadius: "3px",
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: "0.72rem", color: "#555",
                               width: "55px", textAlign: "right", flexShrink: 0 }}>
                  ${(d.total_revenue / 1000).toFixed(1)}k
                </span>
                <span style={{ fontSize: "0.68rem", color: staff.color,
                               width: "75px", textAlign: "right", flexShrink: 0 }}>
                  {staff.count} staff
                </span>
              </div>
            );
          })}
        </div>

        {/*Quick tips*/}
        <p style={sectionLabel}>Prep tips based on NYC cafe patterns</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "1rem" }}>
          {[
            { icon: "☕", title: "Morning rush", tip: "Coffee and espresso drinks account for ~39% of all revenue. Have beans ground and machines warmed 30 min before opening.", color: "#c8956c" },
            { icon: "🍵", title: "Tea peaks mid-morning", tip: "Tea orders (28% of revenue) peak around 10am. Have chai and herbal blends prepped by 9:30am.", color: "#4a7c59" },
            { icon: "🥐", title: "Bakery sells out by 11am", tip: "Pastry and bakery items move fastest in the first 2 hours. Stock the case fully before 8am.", color: "#8b5e3c" },
            { icon: "📉", title: "Afternoon slump 2–4pm", tip: "Traffic drops significantly after lunch. Good window for restocking, cleaning, and prep for the next day.", color: "#6b8cae" },
            { icon: "🌙", title: "Evening wind-down", tip: "After 5pm traffic drops steadily. Reduce batch brewing and focus on made-to-order drinks only.", color: "#b07d62" },
            { icon: "📦", title: "Weekly stock order", tip: "Friday is typically the highest revenue day. Place your weekly stock order Thursday to avoid running out over the weekend.", color: "#d4645a" },
          ].map((tip, i) => (
            <div key={i} style={{
              background: "#111", border: "1px solid #1e1e1e",
              borderLeft: `3px solid ${tip.color}`,
              borderRadius: "8px", padding: "1rem",
            }}>
              <p style={{ fontSize: "1.1rem", margin: "0 0 0.3rem" }}>{tip.icon}
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f0ebe6",
                               marginLeft: "0.4rem" }}>{tip.title}</span>
              </p>
              <p style={{ fontSize: "0.78rem", color: "#666", margin: 0,
                          lineHeight: 1.6 }}>{tip.tip}</p>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

const sectionLabel = {
  fontSize: "0.7rem", color: "#555", textTransform: "uppercase",
  letterSpacing: "0.12em", margin: "0 0 0.75rem",
};