"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { OrderStatusDistribution } from "@/lib/types";
import { statusLabel } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  preparing: "#3B82F6",
  ready: "#8B5CF6",
  delivering: "#F97316",
  delivered: "#16A34A",
  cancelled: "#DC2626",
};

interface StatusPieChartProps {
  data: OrderStatusDistribution[];
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((d) => ({
    name: statusLabel(d.status),
    value: d.count,
    color: STATUS_COLORS[d.status] ?? "#6B7280",
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [Number(value), "commandes"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E5E7EB",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
