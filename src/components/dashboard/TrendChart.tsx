"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export interface DashboardTrendPoint {
  label: string;
  conversations: number;
  bulkMessages: number;
}

interface TrendChartProps {
  data: DashboardTrendPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "#14B8A6", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="conversations"
            name="Conversations"
            stroke="#7C3AED"
            strokeWidth={3}
            dot={{ r: 3, fill: "#7C3AED" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="bulkMessages"
            name="Bulk Messages"
            stroke="#0F766E"
            strokeWidth={3}
            dot={{ r: 3, fill: "#0F766E" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
