"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProjectProgressChart({ data }: { data: { name: string; progress: number; status: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8ecf4" />
        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8891a5" }} unit="%" />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11.5, fill: "#5b6478" }} />
        <Tooltip
          formatter={(value) => [`${value}%`, "Progress"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #eef1f7", fontSize: 12.5, boxShadow: "0 8px 24px -8px rgba(11,17,32,0.16)" }}
        />
        <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.status === "Behind Schedule" ? "#e5484d" : "#2f5eff"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
