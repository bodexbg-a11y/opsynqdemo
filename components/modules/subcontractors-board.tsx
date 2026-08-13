"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import type { Subcontractor, Project } from "@/lib/data/types";
import { SUB_TRADES, SUBCONTRACTOR_STATUSES } from "@/lib/data/constants";
import { deleteSubcontractorAction } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SearchInput,
  FilterSelect,
  FilterSelectPairs,
  FilterPills,
  ClearFiltersButton,
} from "@/components/ui/filter-bar";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import { cn, formatCurrency } from "@/lib/utils";

const TRADE_PILLS = ["All", ...SUB_TRADES] as const;
type TradePill = (typeof TRADE_PILLS)[number];

const SORTS = ["Rating", "Jobs Completed", "Total Invoiced", "Company"] as const;
type SortOption = (typeof SORTS)[number];

export function SubcontractorsBoard({ subcontractors, projects }: { subcontractors: Subcontractor[]; projects: Project[] }) {
  const [trade, setTrade] = useState<TradePill>("All");
  const [status, setStatus] = useState<Subcontractor["status"] | "All">("All");
  const [projectId, setProjectId] = useState("All");
  const [minRating, setMinRating] = useState<"All" | "4+" | "4.5+" | "3+">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Rating");
  const [query, setQuery] = useState("");

  const projectOptions = useMemo(() => {
    const ids = new Set(subcontractors.flatMap((s) => s.activeProjectIds));
    return projects
      .filter((p) => ids.has(p.id))
      .map((p) => ({ value: p.id, label: p.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [subcontractors, projects]);

  const tradeCounts = useMemo(() => {
    const counts: Partial<Record<TradePill, number>> = {};
    for (const t of SUB_TRADES) counts[t] = subcontractors.filter((s) => s.trade === t).length;
    return counts;
  }, [subcontractors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const threshold = minRating === "All" ? 0 : Number(minRating.replace("+", ""));
    const rows = subcontractors.filter((s) => {
      if (trade !== "All" && s.trade !== trade) return false;
      if (status !== "All" && s.status !== status) return false;
      if (projectId !== "All" && !s.activeProjectIds.includes(projectId)) return false;
      if (s.rating < threshold) return false;
      if (q && !`${s.company} ${s.contactName} ${s.email} ${s.trade}`.toLowerCase().includes(q)) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      switch (sortBy) {
        case "Rating":
          return b.rating - a.rating;
        case "Jobs Completed":
          return b.jobsCompleted - a.jobsCompleted;
        case "Total Invoiced":
          return b.totalInvoiced - a.totalInvoiced;
        case "Company":
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });
  }, [subcontractors, trade, status, projectId, minRating, query, sortBy]);

  const hasFilters = trade !== "All" || status !== "All" || projectId !== "All" || minRating !== "All" || query !== "";

  const clearAll = () => {
    setTrade("All");
    setStatus("All");
    setProjectId("All");
    setMinRating("All");
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills value={trade} options={TRADE_PILLS} onChange={setTrade} counts={tradeCounts} />
        <SearchInput value={query} onChange={setQuery} placeholder="Search subcontractors…" className="w-56" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Status" value={status} options={SUBCONTRACTOR_STATUSES} onChange={setStatus} allLabel="Any status" />
        <FilterSelect
          label="Minimum rating"
          value={minRating}
          options={["4.5+", "4+", "3+"] as const}
          onChange={(v) => setMinRating(v as typeof minRating)}
          allLabel="Any rating"
        />
        <FilterSelectPairs label="Active on project" value={projectId} options={projectOptions} onChange={setProjectId} allLabel="Any project" />
        <label className="relative inline-flex items-center">
          <span className="sr-only">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            title="Sort by"
            className="appearance-none cursor-pointer rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 pl-3 pr-7 py-1.5 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>
        </label>
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />
        <span className="ml-auto text-[12px] text-ink-400">
          {filtered.length} of {subcontractors.length} partners
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const activeProjects = projects.filter((p) => s.activeProjectIds.includes(p.id));
          return (
            <Card key={s.id} className="p-5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink-900 truncate">{s.company}</p>
                  <Badge variant="blue" className="mt-1.5">
                    {s.trade}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.status === "Active" ? "success" : "neutral"}>{s.status}</Badge>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/subcontractors/${s.id}/edit`} className="text-ink-400 hover:text-blue-600" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <ConfirmDeleteForm
                      action={deleteSubcontractorAction}
                      fields={{ subcontractorId: s.id }}
                      confirmMessage={`Remove ${s.company} from the roster?`}
                      className="flex"
                    >
                      <button type="submit" className="text-ink-400 hover:text-danger-500" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ConfirmDeleteForm>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-3 text-warning-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(s.rating) ? "fill-warning-500" : "fill-none text-ink-200")} />
                ))}
                <span className="text-[12px] text-ink-500 ml-1">{s.rating.toFixed(1)}</span>
              </div>

              <div className="mt-3 space-y-1.5 text-[12px] text-ink-500">
                {s.contactName && <div className="text-ink-600 font-medium">{s.contactName}</div>}
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  {s.phone || "—"}
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  {s.email || "—"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-2 gap-3 text-[11.5px]">
                <div>
                  <p className="text-ink-400">Jobs Completed</p>
                  <p className="font-semibold text-ink-800">{s.jobsCompleted}</p>
                </div>
                <div>
                  <p className="text-ink-400">Total Invoiced</p>
                  <p className="font-semibold text-ink-800">{formatCurrency(s.totalInvoiced, { compact: true })}</p>
                </div>
              </div>

              {activeProjects.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-1.5">Active On</p>
                  <div className="space-y-1">
                    {activeProjects.slice(0, 2).map((p) => (
                      <Link href={`/projects/${p.id}`} key={p.id} className="block text-[12px] text-blue-600 hover:underline truncate">
                        {p.name}
                      </Link>
                    ))}
                    {activeProjects.length > 2 && (
                      <p className="text-[11px] text-ink-400">+{activeProjects.length - 2} more</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card-surface rounded-2xl p-10 text-center text-ink-400 text-[13px]">
          No subcontractors match your filters.
        </div>
      )}
    </div>
  );
}
