import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART, TOOLTIP_STYLE } from "../theme";

export default function PeakHours({ data }) {
  if (!data?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "1rem" }}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2218" />
          <XAxis dataKey="hour" stroke="#555" tick={{ fill: "#888", fontSize: 11 }}
                 tickFormatter={h => `${h}:00`} />
          <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 11 }}
                 label={{ value: "avg/day", angle: -90, position: "insideLeft",
                          fill: "#555", fontSize: 10, dy: 30 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={h => `${h}:00`}
                   formatter={v => [`${v} orders`, "Avg per day"]} />
          <Bar dataKey="avg_transactions" fill={CHART.peakHours} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}