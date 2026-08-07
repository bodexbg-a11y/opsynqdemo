"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  "In Progress": "#2f5eff",
  "Behind Schedule": "#e5484d",
  Planning: "#b3bacb",
  "On Hold": "#e5a025",
  Completed: "#16a875",
};

export function ProjectStatusDonut({ data }: { data: { status: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="status" innerRadius={62} outerRadius={90} paddingAngle={3} cornerRadius={6} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.status} fill={COLORS[d.status] ?? "#8891a5"} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef1f7", fontSize: 12.5, boxShadow: "0 8px 24px -8px rgba(11,17,32,0.16)" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: -6 }}>
        <p className="text-2xl font-semibold text-ink-900">{total}</p>
        <p className="text-[11px] text-ink-400">Projects</p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[d.status] }} />
            <span className="truncate">{d.status}</span>
            <span className="ml-auto font-medium text-ink-700">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
