"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import type { Project, Client, Employee } from "@/lib/data/types";
import { ProjectStatusBadge, RiskBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { projectProfitability } from "@/lib/data/analytics";

const STATUS_FILTERS = ["All", "In Progress", "Behind Schedule", "Planning", "On Hold", "Completed"] as const;

export function ProjectsTable({
  projects,
  clients,
  employees,
}: {
  projects: Project[];
  clients: Client[];
  employees: Employee[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (status !== "All" && p.status !== status) return false;
      if (query && !`${p.name} ${clientMap.get(p.clientId)?.company ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [projects, status, query, clientMap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
                status === s ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
              )}
            >
              {s}
              {s !== "All" && (
                <span className="ml-1.5 text-[11px] opacity-70">{projects.filter((p) => p.status === s).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">PM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const client = clientMap.get(p.clientId);
                const pm = employeeMap.get(p.projectManagerId);
                const { profit } = projectProfitability(p);
                return (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors group">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${p.id}`} className="flex items-center gap-2 font-medium text-ink-800 hover:text-blue-600">
                        {p.name}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-ink-400 text-[11.5px] mt-0.5">{p.city}, {p.state} · {p.category}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{client?.company ?? "—"}</td>
                    <td className="px-4 py-3"><ProjectStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3"><RiskBadge risk={p.riskLevel} /></td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={p.progress} className="w-16" tone={p.status === "Behind Schedule" ? "danger" : "blue"} />
                        <span className="text-ink-500 text-[11.5px]">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatCurrency(p.budget, { compact: true })}</td>
                    <td className={cn("px-4 py-3 whitespace-nowrap font-medium", profit >= 0 ? "text-success-500" : "text-danger-500")}>
                      {profit >= 0 ? "+" : ""}
                      {formatCurrency(profit, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(p.deadline)}</td>
                    <td className="px-4 py-3">{pm && <Avatar name={pm.name} size={26} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No projects match your filters.</div>}
      </div>
    </div>
  );
}
