import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART, TOOLTIP_STYLE } from "../theme";

const fmt$ = n => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function RevenueChart({ data }) {
  if (!data?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "1rem" }}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2218" />
          <XAxis dataKey="month_name" stroke="#555" tick={{ fill: "#888", fontSize: 12 }} />
          <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 12 }}
                 tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={v => fmt$(v)} contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="revenue" stroke={CHART.line} strokeWidth={2.5}
                dot={{ r: 4, fill: CHART.line }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}