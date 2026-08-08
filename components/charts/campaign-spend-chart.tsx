"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function CampaignSpendChart({ data }: { data: { month: string; facebook: number; google: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
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
          formatter={(value, name) => [formatCurrency(Number(value)), name === "facebook" ? "Facebook Ads" : "Google Ads"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #eef1f7", fontSize: 12.5, boxShadow: "0 8px 24px -8px rgba(11,17,32,0.16)" }}
        />
        <Legend
          formatter={(value) => (value === "facebook" ? "Facebook Ads" : "Google Ads")}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar dataKey="facebook" fill="#1877F2" radius={[6, 6, 0, 0]} barSize={16} />
        <Bar dataKey="google" fill="#34A853" radius={[6, 6, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
