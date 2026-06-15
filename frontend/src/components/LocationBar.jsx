import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { COLORS, TOOLTIP_STYLE } from "../theme";

const fmt$ = n => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ ...TOOLTIP_STYLE, minWidth: "180px" }}>
      <p style={{ fontWeight: 700, marginBottom: "0.4rem", color: "#f0ebe6" }}>{label}</p>
      <p style={{ color: "#888", margin: "0.2rem 0" }}>Revenue: <span style={{ color: "#f0ebe6" }}>{fmt$(d.total_revenue)}</span></p>
      <p style={{ color: "#888", margin: "0.2rem 0" }}>Transactions: <span style={{ color: "#f0ebe6" }}>{d.total_transactions?.toLocaleString()}</span></p>
      <p style={{ color: "#888", margin: "0.2rem 0" }}>Avg order: <span style={{ color: "#f0ebe6" }}>{fmt$(d.avg_order_value)}</span></p>
    </div>
  );
};

export default function LocationBar({ data }) {
  if (!data?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "1rem" }}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2218" />
          <XAxis dataKey="store_location" stroke="#555" tick={{ fill: "#888", fontSize: 12 }} />
          <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 12 }}
                 tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_revenue" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}