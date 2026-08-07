"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TeamProductivityChart({ data }: { data: { name: string; score: number; hours: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ecf4" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: "#8891a5" }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8891a5" }} width={30} />
        <Tooltip
          formatter={(value, name) => [name === "score" ? `${value}/100` : `${value} hrs/wk`, name === "score" ? "Performance" : "Avg Hours"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #eef1f7", fontSize: 12.5, boxShadow: "0 8px 24px -8px rgba(11,17,32,0.16)" }}
        />
        <Bar dataKey="score" fill="#2f5eff" radius={[6, 6, 0, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
