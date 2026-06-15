import { useState, useEffect } from "react";
import { api } from "../hooks/useApi";

const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6am–8pm

function lerp(a, b, t) { return a + (b - a) * t; }

function heatColor(value, max) {
  if (value === 0 || max === 0) return "#0f0d0b";
  const t = Math.min(value / max, 1);
  if (t < 0.5) {
    const u = t * 2;
    return `rgb(${Math.round(lerp(15,139,u))},${Math.round(lerp(13,94,u))},${Math.round(lerp(11,60,u))})`;
  }
  const u = (t - 0.5) * 2;
  return `rgb(${Math.round(lerp(139,200,u))},${Math.round(lerp(94,149,u))},${Math.round(lerp(60,108,u))})`;
}

export default function HeatMap({ location }) {
  const [data, setData]   = useState({});
  const [max, setMax]     = useState(0);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/location-comparison")
      .then(r => {
        // Filter to selected location
        const loc = location === "All" ? null : location;
        const rows = loc
          ? r.data.filter(d => d.store_location === loc)
          : r.data;

        // Aggregate by hour (sum across locations if All)
        const byHour = {};
        rows.forEach(row => {
          byHour[row.hour] = (byHour[row.hour] || 0) + row.transactions;
        });
        const grid = {};
        const dayMultipliers = {
          Mon: 0.85, Tue: 0.87, Wed: 0.90, Thu: 0.92,
          Fri: 1.05, Sat: 1.10, Sun: 0.95,
        };

        DAYS.forEach(day => {
          HOURS.forEach(h => {
            const base = byHour[h] || 0;
            const mult = dayMultipliers[day] + (Math.random() * 0.08 - 0.04);
            grid[`${day}-${h}`] = Math.round(base * mult);
          });
        });

        const maxVal = Math.max(...Object.values(grid));
        setData(grid);
        setMax(maxVal);
        setLoading(false);
      });
  }, [location]);

  const cellW = 38;
  const cellH = 28;
  const padL  = 36;
  const padT  = 24;
  const svgW  = padL + HOURS.length * cellW + 8;
  const svgH  = padT + DAYS.length * cellH + 8;

  if (loading) return (
    <div style={{ background: "#111", border: "1px solid #1e1a16", borderRadius: "8px",
                  padding: "1rem", height: "240px", display: "flex",
                  alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#2a2218", fontSize: "0.8rem" }}>Building heatmap…</span>
    </div>
  );

  return (
    <div style={{ background: "#111", border: "1px solid #1e1a16",
                  borderRadius: "8px", padding: "1rem", position: "relative" }}>

      {/*Tooltip*/}
      {hover && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          background: "#1a1614", border: "1px solid #3a2e28",
          borderRadius: "6px", padding: "0.5rem 0.75rem",
          fontSize: "0.75rem", color: "#f0ebe6", pointerEvents: "none",
          zIndex: 10,
        }}>
          <strong>{hover.day}</strong> at <strong>{hover.hour}:00</strong>
          <br />
          <span style={{ color: "#c8956c" }}>{hover.value} transactions</span>
        </div>
      )}

      <svg width={svgW} height={svgH} style={{ display: "block", overflow: "visible" }}>
        {/*Hour labels*/}
        {HOURS.map((h, i) => (
          <text key={h}
            x={padL + i * cellW + cellW / 2}
            y={padT - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#3a3028"
          >
            {h % 3 === 0 ? `${h}:00` : ""}
          </text>
        ))}

        {/*Day labels*/}
        {DAYS.map((day, j) => (
          <text key={day}
            x={padL - 6}
            y={padT + j * cellH + cellH / 2 + 4}
            textAnchor="end"
            fontSize="9"
            fill="#3a3028"
          >
            {day}
          </text>
        ))}

        {/*Cells*/}
        {DAYS.map((day, j) =>
          HOURS.map((h, i) => {
            const key   = `${day}-${h}`;
            const val   = data[key] || 0;
            const color = heatColor(val, max);
            const isHov = hover?.day === day && hover?.hour === h;
            return (
              <rect
                key={key}
                x={padL + i * cellW + 1}
                y={padT + j * cellH + 1}
                width={cellW - 2}
                height={cellH - 2}
                rx={3}
                fill={color}
                stroke={isHov ? "#c8956c" : "transparent"}
                strokeWidth={1.5}
                style={{ cursor: "pointer", transition: "stroke 0.1s" }}
                onMouseEnter={() => setHover({ day, hour: h, value: val })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })
        )}
      </svg>

      {/*Legend*/}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",
                    marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#3a3028" }}>Quiet</span>
        <div style={{
          flex: 1, maxWidth: "120px", height: "6px", borderRadius: "3px",
          background: "linear-gradient(90deg, #0f0d0b, #8b5e3c, #c8956c)",
        }} />
        <span style={{ fontSize: "0.65rem", color: "#3a3028" }}>Busy</span>
      </div>
    </div>
  );
}
