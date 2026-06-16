import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell
} from "recharts";

import { COLORS } from "../theme";


//Real NYC benchmarks from 149k transactions
//Each entry maps a drink type to real avg price and daily sales from the data
const BENCHMARKS = {
  // Espresso based
  "espresso":      { avg_price: 3.66, daily_qty: 138, peak_hour: 9,  label: "Espresso drinks" },
  "latte":         { avg_price: 3.66, daily_qty: 138, peak_hour: 9,  label: "Espresso drinks" },
  "cappuccino":    { avg_price: 3.66, daily_qty: 138, peak_hour: 8,  label: "Espresso drinks" },
  "americano":     { avg_price: 3.66, daily_qty: 138, peak_hour: 8,  label: "Espresso drinks" },
  "flat white":    { avg_price: 3.66, daily_qty: 138, peak_hour: 8,  label: "Espresso drinks" },
  // Cold coffee
  "cold brew":     { avg_price: 3.12, daily_qty: 69,  peak_hour: 10, label: "Premium brewed coffee" },
  "iced coffee":   { avg_price: 2.70, daily_qty: 144, peak_hour: 10, label: "Gourmet brewed coffee" },
  "iced latte":    { avg_price: 3.66, daily_qty: 138, peak_hour: 10, label: "Espresso drinks" },
  "frappuccino":   { avg_price: 3.66, daily_qty: 138, peak_hour: 11, label: "Espresso drinks" },
  // Drip / brewed coffee
  "drip":          { avg_price: 2.48, daily_qty: 71,  peak_hour: 8,  label: "Drip coffee" },
  "pour over":     { avg_price: 2.90, daily_qty: 72,  peak_hour: 8,  label: "Organic brewed coffee" },
  "filter":        { avg_price: 2.48, daily_qty: 71,  peak_hour: 8,  label: "Drip coffee" },
  "coffee":        { avg_price: 2.70, daily_qty: 144, peak_hour: 8,  label: "Gourmet brewed coffee" },
  // Tea
  "matcha":        { avg_price: 2.74, daily_qty: 48,  peak_hour: 10, label: "Brewed Green tea" },
  "green tea":     { avg_price: 2.74, daily_qty: 48,  peak_hour: 10, label: "Brewed Green tea" },
  "chai":          { avg_price: 2.94, daily_qty: 145, peak_hour: 9,  label: "Brewed Chai tea" },
  "black tea":     { avg_price: 2.74, daily_qty: 97,  peak_hour: 9,  label: "Brewed Black tea" },
  "herbal tea":    { avg_price: 2.74, daily_qty: 96,  peak_hour: 14, label: "Brewed herbal tea" },
  "tea":           { avg_price: 2.74, daily_qty: 97,  peak_hour: 9,  label: "Brewed Black tea" },
  // Chocolate
  "hot chocolate": { avg_price: 4.15, daily_qty: 96,  peak_hour: 11, label: "Hot chocolate" },
  "mocha":         { avg_price: 4.15, daily_qty: 96,  peak_hour: 9,  label: "Hot chocolate" },
  "chocolate":     { avg_price: 4.15, daily_qty: 96,  peak_hour: 11, label: "Hot chocolate" },
  // Bakery
  "croissant":     { avg_price: 3.69, daily_qty: 39,  peak_hour: 8,  label: "Pastry" },
  "muffin":        { avg_price: 3.69, daily_qty: 39,  peak_hour: 8,  label: "Pastry" },
  "scone":         { avg_price: 3.53, daily_qty: 58,  peak_hour: 8,  label: "Scone" },
  "biscotti":      { avg_price: 3.42, daily_qty: 32,  peak_hour: 9,  label: "Biscotti" },
  "bagel":         { avg_price: 3.53, daily_qty: 58,  peak_hour: 8,  label: "Pastry" },
  "pastry":        { avg_price: 3.69, daily_qty: 39,  peak_hour: 8,  label: "Pastry" },
};

const DEFAULT_BENCHMARK = { avg_price: 3.02, daily_qty: 100, peak_hour: 9, label: "General coffee drink" };

function getBenchmark(name) {
  const n = name.toLowerCase();

  // 1. Multi-word phrases first
  if (n.includes("cold brew"))     return { ...BENCHMARKS["cold brew"],     matchedKey: "cold brew" };
  if (n.includes("iced latte"))    return { ...BENCHMARKS["iced latte"],    matchedKey: "iced latte" };
  if (n.includes("iced coffee"))   return { ...BENCHMARKS["iced coffee"],   matchedKey: "iced coffee" };
  if (n.includes("flat white"))    return { ...BENCHMARKS["flat white"],    matchedKey: "flat white" };
  if (n.includes("pour over"))     return { ...BENCHMARKS["pour over"],     matchedKey: "pour over" };
  if (n.includes("hot cocoa") || n.includes("hot choc") || n.includes("cocoa"))
                                   return { ...BENCHMARKS["hot chocolate"], matchedKey: "hot chocolate" };
  if (n.includes("green tea"))     return { ...BENCHMARKS["green tea"],     matchedKey: "green tea" };
  if (n.includes("black tea"))     return { ...BENCHMARKS["black tea"],     matchedKey: "black tea" };
  if (n.includes("herbal tea"))    return { ...BENCHMARKS["herbal tea"],    matchedKey: "herbal tea" };
  if (n.includes("extra shot"))    return { ...BENCHMARKS["espresso"],      matchedKey: "espresso" };

  // 2. Bakery — cookie and jam BEFORE chocolate
  if (n.includes("cookie") || n.includes("peanut"))
                                   return { ...BENCHMARKS["muffin"],        matchedKey: "pastry" };
  if (n.includes("jam"))           return { ...BENCHMARKS["muffin"],        matchedKey: "pastry" };
  if (n.includes("banana") || n.includes("muffin") || n.includes("brownie") ||
      n.includes("loaf")   || n.includes("tart")   || n.includes("cake")   ||
      n.includes("bun")    || n.includes("donut")  || n.includes("danish") ||
      n.includes("waffle"))        return { ...BENCHMARKS["muffin"],        matchedKey: "pastry" };
  if (n.includes("croissant"))     return { ...BENCHMARKS["croissant"],     matchedKey: "croissant" };
  if (n.includes("scone"))         return { ...BENCHMARKS["scone"],         matchedKey: "scone" };
  if (n.includes("biscotti"))      return { ...BENCHMARKS["biscotti"],      matchedKey: "biscotti" };
  if (n.includes("bagel") || n.includes("pastry") || n.includes("bread"))
                                   return { ...BENCHMARKS["pastry"],        matchedKey: "pastry" };

  // 3. Single-word drinks
  if (n.includes("hojicha") || n.includes("houjicha"))
                                   return { ...BENCHMARKS["green tea"],     matchedKey: "green tea" };
  if (n.includes("matcha"))        return { ...BENCHMARKS["matcha"],        matchedKey: "matcha" };
  if (n.includes("chai"))          return { ...BENCHMARKS["chai"],          matchedKey: "chai" };
  if (n.includes("mocha"))         return { ...BENCHMARKS["espresso"],      matchedKey: "espresso" };
  if (n.includes("cappuccino"))    return { ...BENCHMARKS["cappuccino"],    matchedKey: "cappuccino" };
  if (n.includes("americano"))     return { ...BENCHMARKS["americano"],     matchedKey: "americano" };
  if (n.includes("cortado"))       return { ...BENCHMARKS["espresso"],      matchedKey: "espresso" };
  if (n.includes("frappuccino"))   return { ...BENCHMARKS["frappuccino"],   matchedKey: "frappuccino" };
  if (n.includes("espresso"))      return { ...BENCHMARKS["espresso"],      matchedKey: "espresso" };
  if (n.includes("latte"))         return { ...BENCHMARKS["latte"],         matchedKey: "latte" };
  if (n.includes("chocolate"))     return { ...BENCHMARKS["hot chocolate"], matchedKey: "hot chocolate" };

  // 4. Generic fallbacks
  if (n.includes("tea"))           return { ...BENCHMARKS["herbal tea"],    matchedKey: "herbal tea" };
  if (n.includes("drip") || n.includes("filter"))
                                   return { ...BENCHMARKS["drip"],          matchedKey: "drip" };
  if (n.includes("coffee"))        return { ...BENCHMARKS["coffee"],        matchedKey: "coffee" };

  return { ...DEFAULT_BENCHMARK, matchedKey: "general" };
}

function getInsight(myPrice, mySales, benchmark) {
  const priceDiff = myPrice - benchmark.avg_price;
  const qtyRatio  = mySales / benchmark.daily_qty;

  let priceNote, priceColor;
  if (priceDiff > 2.0) {
    priceNote  = `$${priceDiff.toFixed(2)} above NYC avg — premium positioning. Justify with quality or atmosphere.`;
    priceColor = "#f59e0b";
  } else if (priceDiff > 0.75) {
    priceNote  = `$${priceDiff.toFixed(2)} above NYC avg — slightly premium. Reasonable for quality ingredients.`;
    priceColor = "#f59e0b";
  } else if (priceDiff < -0.75) {
    priceNote  = `$${Math.abs(priceDiff).toFixed(2)} below NYC avg — room to raise price without losing customers.`;
    priceColor = "#f43f5e";
  } else {
    priceNote  = `Right in line with NYC average pricing for this drink type.`;
    priceColor = "#10b981";
  }

  let salesNote, salesColor;
  if (qtyRatio > 1.3) {
    salesNote  = `Outselling NYC average by ${((qtyRatio - 1) * 100).toFixed(0)}% — this is a star item.`;
    salesColor = "#10b981";
  } else if (qtyRatio > 0.8) {
    salesNote  = `On par with NYC average daily sales for this category.`;
    salesColor = "#f59e0b";
  } else {
    salesNote  = `Below NYC average. Peak hours for this drink: ${benchmark.peak_hour}:00–${benchmark.peak_hour + 2}:00. Push promotions then.`;
    salesColor = "#f43f5e";
  }

  return { priceNote, priceColor, salesNote, salesColor };
}

const COLORS  = ["#6366f1","#22d3ee","#f59e0b","#10b981","#f43f5e","#a78bfa","#34d399","#fb923c"];
const tooltip = { background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px",
                  color: "#f0f0f0", fontSize: "0.8rem", padding: "8px 12px" };

const CustomBarTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px",
                  padding: "0.75rem 1rem", fontSize: "0.8rem" }}>
      <p style={{ color: "#f0f0f0", fontWeight: 600, margin: "0 0 0.4rem" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color === "#2a2a2a" ? "#aaa" : p.color,
                            margin: "0.15rem 0" }}>
          {p.name}: <strong style={{ color: "#f0f0f0" }}>
            {prefix}{typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </strong>
        </p>
      ))}
    </div>
  );
};

const DEFAULT_MENU = [
  { id: 1, name: "Cold Brew",    price: "5.50", dailySales: "35" },
  { id: 2, name: "Matcha Latte", price: "6.00", dailySales: "22" },
  { id: 3, name: "Iced Latte",   price: "5.00", dailySales: "40" },
];

export default function MenuComparison({ menu, setMenu, nextId, setNextId, menuView, setMenuView }) {
  const view    = menuView;
  const setView = setMenuView;
  const [newName, setNewName]   = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newSales, setNewSales] = useState("");

  function addItem() {
    if (!newName.trim() || !newPrice || !newSales) return;
    setMenu([...menu, { id: nextId, name: newName.trim(), price: newPrice, dailySales: newSales }]);
    setNextId(nextId + 1);
    setNewName(""); setNewPrice(""); setNewSales("");
  }

  function removeItem(id) { setMenu(menu.filter(i => i.id !== id)); }

  const enriched = menu.map(item => {
    const price     = parseFloat(item.price)      || 0;
    const sales     = parseFloat(item.dailySales) || 0;
    const benchmark = getBenchmark(item.name);
    const insight   = getInsight(price, sales, benchmark);
    return { ...item, price, sales, benchmark, insight };
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "2rem 0 1.5rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f0f0f0" }}>
          My Menu vs. NYC
        </h2>
        <p style={{ color: "#555", margin: "0 auto", maxWidth: "520px", fontSize: "0.9rem" }}>
          Enter your drinks, prices, and daily sales. Each drink is matched to its
          real NYC equivalent from 149,116 transactions — so the comparison is actually accurate.
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: "#0f0f0f",
        border: "1px solid #2a2a2a",
        borderLeft: "4px solid #f59e0b",
        borderRadius: "8px",
        padding: "0.9rem 1.25rem",
        marginBottom: "1.75rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "1rem", marginTop: "0.05rem" }}>⚠️</span>
        <div>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f59e0b",
                      margin: "0 0 0.25rem" }}>About the NYC benchmarks</p>
          <p style={{ fontSize: "0.78rem", color: "#666", margin: 0, lineHeight: 1.6 }}>
            The NYC averages come from <strong style={{ color: "#888" }}>3 combined locations</strong> of
            Maven Roasters (Astoria, Hell's Kitchen, Lower Manhattan). A single small cafe will
            typically see <strong style={{ color: "#888" }}>roughly 1/3 of these daily sales figures</strong>.
            Use the sales comparison as a directional benchmark, not an exact target.
            Pricing comparisons are accurate regardless of cafe size.
          </p>
        </div>
      </div>

      {/* Add form */}
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px",
                    padding: "1.5rem", marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase",
                    letterSpacing: "0.12em", marginBottom: "1rem" }}>Add a drink or item</p>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto",
                      gap: "0.75rem", alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
                   placeholder="Cold Brew, Matcha Latte, Croissant…"
                   style={inputStyle}
                   onKeyDown={e => e.key === "Enter" && addItem()} />
          </div>
          <div>
            <label style={labelStyle}>Your Price ($)</label>
            <input value={newPrice} onChange={e => setNewPrice(e.target.value)}
                   placeholder="5.50" type="number" step="0.25" min="0"
                   style={inputStyle}
                   onKeyDown={e => e.key === "Enter" && addItem()} />
          </div>
          <div>
            <label style={labelStyle}>Daily Sales (units)</label>
            <input value={newSales} onChange={e => setNewSales(e.target.value)}
                   placeholder="35" type="number" min="0"
                   style={inputStyle}
                   onKeyDown={e => e.key === "Enter" && addItem()} />
          </div>
          <button onClick={addItem} style={{
            background: "#6366f1", border: "none", borderRadius: "6px",
            color: "#fff", padding: "0 1.25rem", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 600, height: "38px",
          }}>+ Add</button>
        </div>
        <p style={{ fontSize: "0.7rem", color: "#333", margin: "0.75rem 0 0" }}>
          Tip: be specific — "Cold Brew", "Matcha Latte", "Iced Latte", "Croissant", "Chai" all match real NYC data automatically.
        </p>
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {["table", "chart"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "0.35rem 0.9rem", borderRadius: "20px", cursor: "pointer",
            fontSize: "0.78rem", fontWeight: view === v ? 600 : 400,
            border: `1px solid ${view === v ? "#6366f1" : "#2a2a2a"}`,
            background: view === v ? "#6366f1" : "transparent",
            color: view === v ? "#fff" : "#555",
          }}>{v === "table" ? "Breakdown" : "Charts"}</button>
        ))}
      </div>

      {/* Table view */}
      {view === "table" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {enriched.length === 0 && (
            <p style={{ color: "#333", textAlign: "center", padding: "3rem" }}>
              Add your first drink above to get started.
            </p>
          )}
          {enriched.map((item, i) => (
            <div key={item.id} style={{
              background: "#111", border: "1px solid #1e1e1e",
              borderLeft: `4px solid ${COLORS[i % COLORS.length]}`,
              borderRadius: "8px", padding: "1.25rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.3rem", fontSize: "1rem",
                               fontWeight: 600, color: "#f0f0f0" }}>{item.name}</h3>
                  <span style={{ fontSize: "0.68rem", color: "#444", background: "#1a1a1a",
                                 padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                    matched to: {item.benchmark.label}
                  </span>
                </div>
                <button onClick={() => removeItem(item.id)} style={{
                  background: "transparent", border: "1px solid #2a2a2a", borderRadius: "4px",
                  color: "#444", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.72rem"
                }}>remove</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "1rem", marginBottom: "1rem" }}>
                <Metric label="Your Price"    value={`$${item.price.toFixed(2)}`}                     color="#f0f0f0" />
                <Metric label="NYC Type Avg"  value={`$${item.benchmark.avg_price.toFixed(2)}`}       color="#555" />
                <Metric label="Your Daily"    value={`${item.sales} units`}                            color="#f0f0f0" />
                <Metric label="NYC Daily Avg" value={`${item.benchmark.daily_qty} units`}              color="#555" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem",
                            marginBottom: "0.75rem" }}>
                <Insight icon="💰" text={item.insight.priceNote} color={item.insight.priceColor} />
                <Insight icon="📊" text={item.insight.salesNote} color={item.insight.salesColor} />
              </div>

              <div style={{ background: "#0f0f0f", borderRadius: "6px", padding: "0.6rem 0.75rem",
                            fontSize: "0.75rem", color: "#555" }}>
                ⏰ NYC peak hours for <strong style={{ color: "#aaa" }}>{item.benchmark.label}</strong>:{" "}
                <strong style={{ color: "#aaa" }}>
                  {item.benchmark.peak_hour}:00 – {item.benchmark.peak_hour + 2}:00
                </strong>
                {" "}— stock up and staff accordingly before this window.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart view */}
      {view === "chart" && enriched.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Price comparison */}
          <div>
            <p style={sectionLabel}>Your Price vs NYC Type Average</p>
            <div style={chartBox}>
              <ResponsiveContainer width="100%" height={Math.max(200, enriched.length * 60)}>
                <BarChart data={enriched.map((item, i) => ({
                  name:        item.name,
                  "Your Price": item.price,
                  "NYC Avg":    item.benchmark.avg_price,
                  color:        COLORS[i % COLORS.length],
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis type="number" stroke="#888" tick={{ fill: "#aaa", fontSize: 11 }}
                         tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={120}
                         tick={{ fill: "#aaa", fontSize: 11 }} />
                  <Tooltip content={<CustomBarTooltip prefix="$" />} />
                  <Bar dataKey="Your Price" radius={[0,3,3,0]}>
                    {enriched.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                  <Bar dataKey="NYC Avg" fill="#2a2a2a" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales comparison */}
          <div>
            <p style={sectionLabel}>Your Daily Sales vs NYC Type Average</p>
            <div style={chartBox}>
              <ResponsiveContainer width="100%" height={Math.max(200, enriched.length * 60)}>
                <BarChart data={enriched.map((item, i) => ({
                  name:         item.name,
                  "Your Sales": item.sales,
                  "NYC Avg":    item.benchmark.daily_qty,
                  color:        COLORS[i % COLORS.length],
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis type="number" stroke="#888" tick={{ fill: "#aaa", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120}
                         tick={{ fill: "#aaa", fontSize: 11 }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="Your Sales" radius={[0,3,3,0]}>
                    {enriched.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                  <Bar dataKey="NYC Avg" fill="#2a2a2a" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar */}
          <div>
            <p style={sectionLabel}>Performance vs NYC Benchmark (100 = NYC average)</p>
            <div style={chartBox}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={enriched.map(item => ({
                  name:        item.name,
                  "Price %":   Math.round((item.price / item.benchmark.avg_price) * 100),
                  "Sales %":   Math.round((item.sales / item.benchmark.daily_qty) * 100),
                }))}>
                  <PolarGrid stroke="#2a2a2a" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "#aaa", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 250]}
                                   tick={{ fill: "#444", fontSize: 9 }} />
                  <Radar name="Price %"  dataKey="Price %"
                         stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  <Radar name="Sales %"  dataKey="Sales %"
                         stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                  <Tooltip contentStyle={tooltip} formatter={v => `${v}% of NYC avg`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <p style={{ fontSize: "0.68rem", color: "#444", textTransform: "uppercase",
                  letterSpacing: "0.1em", margin: "0 0 0.3rem" }}>{label}</p>
      <p style={{ fontSize: "1.1rem", fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}

function Insight({ icon, text, color }) {
  return (
    <div style={{ background: "#0f0f0f", borderRadius: "6px", padding: "0.6rem 0.75rem",
                  borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: "0.78rem", color: "#888", margin: 0, lineHeight: 1.5 }}>
        {icon} {text}
      </p>
    </div>
  );
}

const labelStyle  = { display: "block", fontSize: "0.68rem", color: "#555",
                       textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" };
const inputStyle  = { width: "100%", background: "#0f0f0f", border: "1px solid #2a2a2a",
                       borderRadius: "6px", padding: "0.5rem 0.75rem", color: "#f0f0f0",
                       fontSize: "0.85rem", outline: "none" };
const sectionLabel = { fontSize: "0.7rem", color: "#555", textTransform: "uppercase",
                        letterSpacing: "0.12em", margin: "0 0 0.75rem" };
const chartBox    = { background: "#111", border: "1px solid #1e1e1e",
                       borderRadius: "8px", padding: "1rem" };