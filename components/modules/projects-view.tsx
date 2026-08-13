"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, LayoutGrid, List as ListIcon, MapPin, CalendarClock, Building2 } from "lucide-react";
import type { Project, Client, Employee } from "@/lib/data/types";
import { PROJECT_CATEGORIES, RISK_LEVELS } from "@/lib/data/constants";
import { ProjectStatusBadge, RiskBadge, Badge } from "@/components/ui/badge";
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

/** Left accent colour on grid cards, so status reads at a glance across the board. */
const STATUS_ACCENT: Record<string, string> = {
  "In Progress": "bg-blue-500",
  "Behind Schedule": "bg-danger-500",
  Planning: "bg-ink-300",
  "On Hold": "bg-warning-500",
  Completed: "bg-success-500",
};

/**
 * Compares budget burn against completion — the signal a director actually wants
 * from a glance at the board. A raw margin figure is misleading early on, since a
 * barely-started project trivially shows a huge "margin" just by not having spent yet.
 */
function paceState(progress: number, spentPct: number, status: string, margin: number) {
  if (status === "Completed") {
    return {
      label: `${margin.toFixed(1)}% final margin`,
      variant: margin >= 15 ? ("success" as const) : margin >= 0 ? ("warning" as const) : ("danger" as const),
    };
  }
  if (progress === 0) return { label: "Not started", variant: "neutral" as const };

  const gap = spentPct - progress;
  if (gap > 10) return { label: `${Math.round(gap)}% over pace`, variant: "danger" as const };
  if (gap < -10) return { label: `${Math.round(-gap)}% under pace`, variant: "success" as const };
  return { label: "On pace", variant: "neutral" as const };
}

/** Days until the deadline, plus how urgently to render it. */
function deadlineState(deadline: string, status: string) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (status === "Completed") return { label: `Delivered ${formatDate(deadline)}`, tone: "text-ink-400" };
  if (days < 0) return { label: `${Math.abs(days)} days overdue`, tone: "text-danger-500 font-medium" };
  if (days === 0) return { label: "Due today", tone: "text-danger-500 font-medium" };
  if (days <= 14) return { label: `Due in ${days} days`, tone: "text-warning-500 font-medium" };
  return { label: `Due ${formatDate(deadline)}`, tone: "text-ink-500" };
}

export function ProjectsView({
  projects,
  clients,
  employees,
}: {
  projects: Project[];
  clients: Client[];
  employees: Employee[];
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
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
  // dropdowns never list an option that can only ever produce an empty result.
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
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search projects…" className="w-56" />
          <div className="flex items-center bg-ink-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                view === "grid" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              title="List view"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                view === "list" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              )}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Category" value={category} options={PROJECT_CATEGORIES} onChange={setCategory} allLabel="All categories" />
        <FilterSelect label="Risk" value={risk} options={RISK_LEVELS} onChange={setRisk} allLabel="All risk levels" />
        <FilterSelectPairs label="Client" value={clientId} options={clientOptions} onChange={setClientId} allLabel="All clients" />
        <FilterSelectPairs label="Project Manager" value={pmId} options={pmOptions} onChange={setPmId} allLabel="All managers" />
        {view === "grid" && (
          <label className="relative inline-flex items-center">
            <span className="sr-only">Sort by</span>
            <select
              value={sort.key ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setSort(value ? { key: value as SortKey, dir: value === "name" || value === "client" ? "asc" : "desc" } : { key: null, dir: "asc" });
              }}
              title="Sort by"
              className="appearance-none cursor-pointer rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 pl-3 pr-7 py-1.5 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              <option value="">Sort: Default</option>
              <option value="deadline">Sort: Deadline</option>
              <option value="budget">Sort: Budget</option>
              <option value="profit">Sort: Profit</option>
              <option value="progress">Sort: Progress</option>
              <option value="risk">Sort: Risk</option>
              <option value="name">Sort: Name</option>
            </select>
          </label>
        )}
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />
        <span className="ml-auto text-[12px] text-ink-400">
          {filtered.length} of {projects.length} projects
        </span>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const client = clientMap.get(p.clientId);
            const pm = employeeMap.get(p.projectManagerId);
            const { profit, margin } = projectProfitability(p);
            const due = deadlineState(p.deadline, p.status);
            const spentPct = p.budget > 0 ? Math.min(100, (p.spent / p.budget) * 100) : 0;
            const overBudget = p.spent > p.budget;
            const pace = paceState(p.progress, spentPct, p.status, margin);

            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="group block">
                <div className="card-surface rounded-2xl overflow-hidden h-full flex flex-col hover:shadow-lg hover:border-blue-200 transition-all">
                  {/* Site photo header */}
                  <div className="relative h-36 bg-ink-100 overflow-hidden">
                    {p.photos[0] ? (
                      <Image
                        src={p.photos[0]}
                        // Decorative: the project name is rendered as text directly over
                        // this image, so repeating it here would be noise for screen
                        // readers and shows as broken-image text if the photo 404s.
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/75 via-navy-900/10 to-transparent" />
                    <span className={cn("absolute left-0 top-0 bottom-0 w-1", STATUS_ACCENT[p.status] ?? "bg-ink-300")} />

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <RiskBadge risk={p.riskLevel} />
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-[14px] font-semibold text-white leading-snug line-clamp-1 drop-shadow">{p.name}</p>
                      <p className="text-[11.5px] text-white/80 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {p.city}, {p.state} · {p.category}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-ink-500 truncate">{client?.company ?? "—"}</span>
                      <ProjectStatusBadge status={p.status} />
                    </div>

                    {/* Progress */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="text-ink-400">Progress</span>
                        <span className="font-medium text-ink-700">{p.progress}%</span>
                      </div>
                      <ProgressBar value={p.progress} tone={p.status === "Behind Schedule" ? "danger" : "blue"} />
                    </div>

                    {/* Budget burn */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="text-ink-400">
                          {formatCurrency(p.spent, { compact: true })} of {formatCurrency(p.budget, { compact: true })}
                        </span>
                        <span className={cn("font-medium", profit >= 0 ? "text-success-500" : "text-danger-500")}>
                          {profit >= 0 ? "+" : ""}
                          {formatCurrency(profit, { compact: true })}
                        </span>
                      </div>
                      <ProgressBar value={spentPct} tone={overBudget ? "danger" : spentPct > 85 ? "warning" : "success"} />
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-3.5 flex items-center justify-between gap-2 border-t border-ink-50">
                      <div className="flex items-center gap-2 min-w-0">
                        {pm && <Avatar name={pm.name} size={24} />}
                        <span className="text-[11.5px] text-ink-500 truncate">{pm?.name ?? "Unassigned"}</span>
                      </div>
                      <span className={cn("text-[11.5px] flex items-center gap-1 whitespace-nowrap", due.tone)}>
                        <CalendarClock className="w-3 h-3 shrink-0" />
                        {due.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <Badge variant={pace.variant}>{pace.label}</Badge>
                      <span className="text-[11.5px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        Open
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
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
                      <td className="px-5 py-3 min-w-[230px]">
                        <Link href={`/projects/${p.id}`} className="flex items-center gap-2 font-medium text-ink-800 hover:text-blue-600">
                          {p.name}
                          <ArrowUpRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-ink-400 text-[11.5px] mt-0.5">
                          {p.city}, {p.state} · {p.category}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{client?.company ?? "—"}</td>
                      <td className="px-4 py-3">
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge risk={p.riskLevel} />
                      </td>
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
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card-surface rounded-2xl p-10 text-center text-ink-400 text-[13px]">No projects match your filters.</div>
      )}
    </div>
  );
}
