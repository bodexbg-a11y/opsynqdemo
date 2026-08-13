"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project, Client, Employee } from "@/lib/data/types";
import { PROJECT_CATEGORIES, RISK_LEVELS } from "@/lib/data/constants";
import { ProjectStatusBadge, RiskBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import {
  SearchInput,
  FilterSelect,
  FilterSelectPairs,
  FilterPills,
  ClearFiltersButton,
  SortHeader,
  nextSort,
  compareValues,
} from "@/components/ui/filter-bar";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { projectProfitability } from "@/lib/data/analytics";

const STATUS_FILTERS = ["All", "In Progress", "Behind Schedule", "Planning", "On Hold", "Completed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type SortKey = "name" | "client" | "status" | "risk" | "progress" | "budget" | "profit" | "deadline";

const RISK_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2 };

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
  const [status, setStatus] = useState<StatusFilter>("All");
  const [category, setCategory] = useState<(typeof PROJECT_CATEGORIES)[number] | "All">("All");
  const [risk, setRisk] = useState<(typeof RISK_LEVELS)[number] | "All">("All");
  const [clientId, setClientId] = useState("All");
  const [pmId, setPmId] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({ key: null, dir: "asc" });

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  // Only offer clients/PMs that actually appear in the visible project set, so the
  // dropdowns never list an option that can only ever produce an empty table.
  const clientOptions = useMemo(() => {
    const ids = new Set(projects.map((p) => p.clientId));
    return clients
      .filter((c) => ids.has(c.id))
      .map((c) => ({ value: c.id, label: c.company }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projects, clients]);

  const pmOptions = useMemo(() => {
    const ids = new Set(projects.map((p) => p.projectManagerId));
    return employees
      .filter((e) => ids.has(e.id))
      .map((e) => ({ value: e.id, label: e.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projects, employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = projects.filter((p) => {
      if (status !== "All" && p.status !== status) return false;
      if (category !== "All" && p.category !== category) return false;
      if (risk !== "All" && p.riskLevel !== risk) return false;
      if (clientId !== "All" && p.clientId !== clientId) return false;
      if (pmId !== "All" && p.projectManagerId !== pmId) return false;
      if (q) {
        const haystack = `${p.name} ${p.city} ${p.state} ${p.category} ${clientMap.get(p.clientId)?.company ?? ""}`;
        if (!haystack.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (!sort.key) return rows;
    const key = sort.key;
    const sorted = [...rows].sort((a, b) => {
      switch (key) {
        case "name":
          return compareValues(a.name, b.name);
        case "client":
          return compareValues(clientMap.get(a.clientId)?.company, clientMap.get(b.clientId)?.company);
        case "status":
          return compareValues(a.status, b.status);
        case "risk":
          return RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
        case "progress":
          return a.progress - b.progress;
        case "budget":
          return a.budget - b.budget;
        case "profit":
          return projectProfitability(a).profit - projectProfitability(b).profit;
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });
    return sort.dir === "asc" ? sorted : sorted.reverse();
  }, [projects, status, category, risk, clientId, pmId, query, clientMap, sort]);

  const hasFilters = status !== "All" || category !== "All" || risk !== "All" || clientId !== "All" || pmId !== "All" || query !== "";

  const clearAll = () => {
    setStatus("All");
    setCategory("All");
    setRisk("All");
    setClientId("All");
    setPmId("All");
    setQuery("");
  };

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<StatusFilter, number>> = {};
    for (const s of STATUS_FILTERS) {
      if (s !== "All") counts[s] = projects.filter((p) => p.status === s).length;
    }
    return counts;
  }, [projects]);

  const onSort = (column: SortKey) => setSort((c) => nextSort(c, column));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <FilterPills value={status} options={STATUS_FILTERS} onChange={setStatus} counts={statusCounts} />
        <SearchInput value={query} onChange={setQuery} placeholder="Search projects…" className="w-56" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Category" value={category} options={PROJECT_CATEGORIES} onChange={setCategory} allLabel="All categories" />
        <FilterSelect label="Risk" value={risk} options={RISK_LEVELS} onChange={setRisk} allLabel="All risk levels" />
        <FilterSelectPairs label="Client" value={clientId} options={clientOptions} onChange={setClientId} allLabel="All clients" />
        <FilterSelectPairs label="Project Manager" value={pmId} options={pmOptions} onChange={setPmId} allLabel="All managers" />
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />
        <span className="ml-auto text-[12px] text-ink-400">
          {filtered.length} of {projects.length} projects
        </span>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <SortHeader column="name" label="Project" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} className="px-5" />
                <SortHeader column="client" label="Client" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="status" label="Status" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="risk" label="Risk" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="progress" label="Progress" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="budget" label="Budget" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="profit" label="Profit" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="deadline" label="Deadline" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
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
