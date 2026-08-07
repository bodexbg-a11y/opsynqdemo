"use client";

import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function CashFlowChart({ data }: { data: { month: string; inflow: number; outflow: number; balance: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === "inflow" ? "Cash In" : name === "outflow" ? "Cash Out" : "Balance",
          ]}
          contentStyle={{ borderRadius: 12, border: "1px solid #eef1f7", fontSize: 12.5, boxShadow: "0 8px 24px -8px rgba(11,17,32,0.16)" }}
        />
        <Bar dataKey="inflow" fill="#b8d0ff" radius={[6, 6, 0, 0]} barSize={16} />
        <Bar dataKey="outflow" fill="#dde1ea" radius={[6, 6, 0, 0]} barSize={16} />
        <Line type="monotone" dataKey="balance" stroke="#1d47e6" strokeWidth={2.5} dot={{ r: 3, fill: "#1d47e6" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
