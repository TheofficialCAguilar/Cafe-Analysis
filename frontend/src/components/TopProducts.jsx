import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART, TOOLTIP_STYLE } from "../theme";

export default function TopProducts({ data }) {
  if (!data?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "1rem" }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2218" />
          <XAxis type="number" stroke="#555" tick={{ fill: "#888", fontSize: 11 }} />
          <YAxis type="category" dataKey="product_detail" width={140}
                 tick={{ fill: "#888", fontSize: 11 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="total_qty" fill={CHART.products} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}