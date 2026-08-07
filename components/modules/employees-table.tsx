"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Employee, Team } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["All", "Construction", "Management", "Finance", "Human Resources", "Safety", "Design", "Procurement"] as const;

const STATUS_TONE: Record<Employee["status"], "success" | "warning" | "neutral"> = {
  Active: "success",
  "On Leave": "warning",
  Vacation: "neutral",
};

const PAYROLL_TONE: Record<Employee["payrollStatus"], "success" | "warning" | "neutral"> = {
  Paid: "success",
  Pending: "warning",
  Processing: "neutral",
};

export function EmployeesTable({ employees, teams }: { employees: Employee[]; teams: Team[] }) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<(typeof DEPARTMENTS)[number]>("All");
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const filtered = employees.filter((e) => {
    if (dept !== "All" && e.department !== dept) return false;
    if (query && !`${e.name} ${e.role}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
                dept === d ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Vacation</th>
                <th className="px-4 py-3 font-medium">Payroll</th>
                <th className="px-4 py-3 font-medium">Performance</th>
                <th className="px-4 py-3 font-medium">Permission</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 120).map((e) => (
                <tr key={e.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                  <td className="px-5 py-2.5">
                    <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                      <Avatar name={e.name} size={28} />
                      <div>
                        <p className="font-medium text-ink-800 hover:text-blue-600">{e.name}</p>
                        <p className="text-ink-400 text-[11px]">{e.role}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-600 whitespace-nowrap">{e.department}</td>
                  <td className="px-4 py-2.5 text-ink-500 whitespace-nowrap">{e.teamId ? teamMap.get(e.teamId)?.name.replace(/^Crew /, "") ?? "—" : "—"}</td>
                  <td className="px-4 py-2.5"><Badge variant={STATUS_TONE[e.status]}>{e.status}</Badge></td>
                  <td className="px-4 py-2.5 text-ink-500 whitespace-nowrap">{e.vacationUsed}/{e.vacationTotal} days</td>
                  <td className="px-4 py-2.5"><Badge variant={PAYROLL_TONE[e.payrollStatus]}>{e.payrollStatus}</Badge></td>
                  <td className="px-4 py-2.5 text-ink-700 font-medium">{e.performanceScore}/100</td>
                  <td className="px-4 py-2.5"><Badge variant="neutral">{e.permission}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No employees match your filters.</div>}
      </div>
    </div>
  );
}
