import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { COLORS, TOOLTIP_STYLE } from "../theme";

const fmt$ = n => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CategoryPie({ data }) {
  if (!data?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "1rem" }}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey="total_revenue" nameKey="product_category"
               cx="50%" cy="45%" outerRadius={100} innerRadius={40} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={v => fmt$(v)} contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#888" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}