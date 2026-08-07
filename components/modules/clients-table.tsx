"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import type { Client } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Active", "Past", "Lead"] as const;

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const filtered = clients.filter((c) => {
    if (status !== "All" && c.status !== status) return false;
    if (query && !`${c.company} ${c.city}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
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
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Projects</th>
                <th className="px-4 py-3 font-medium">Total Invoiced</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 150).map((c) => (
                <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors group">
                  <td className="px-5 py-3">
                    <Link href={`/clients/${c.id}`} className="flex items-center gap-2 font-medium text-ink-800 hover:text-blue-600">
                      {c.company}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-ink-400 text-[11.5px] mt-0.5">{c.contacts[0]?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{c.industry}</td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{c.city}, {c.state}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === "Active" ? "success" : c.status === "Lead" ? "blue" : "neutral"}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{c.totalProjects}</td>
                  <td className="px-4 py-3 text-ink-700 font-medium whitespace-nowrap">{formatCurrency(c.totalInvoiced, { compact: true })}</td>
                  <td className={cn("px-4 py-3 whitespace-nowrap font-medium", c.outstandingBalance > 0 ? "text-warning-500" : "text-ink-400")}>
                    {c.outstandingBalance > 0 ? formatCurrency(c.outstandingBalance, { compact: true }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
