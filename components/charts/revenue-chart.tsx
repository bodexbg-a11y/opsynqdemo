"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart({ data }: { data: { month: string; revenue: number; billed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f5eff" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#2f5eff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="billedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#85adff" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#85adff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ecf4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#8891a5" }} dy={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#8891a5" }}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => [formatCurrency(Number(value)), name === "revenue" ? "Revenue" : "Billed"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #eef1f7", fontSize: 12.5, boxShadow: "0 8px 24px -8px rgba(11,17,32,0.16)" }}
        />
        <Area type="monotone" dataKey="billed" stroke="#85adff" strokeWidth={2} fill="url(#billedFill)" />
        <Area type="monotone" dataKey="revenue" stroke="#2f5eff" strokeWidth={2.5} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
