"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Invoice, Project, Client } from "@/lib/data/types";
import { InvoiceStatusBadge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Paid", "Pending", "Overdue", "Draft"] as const;

export function InvoicesTable({ invoices, projects, clients }: { invoices: Invoice[]; projects: Project[]; clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const filtered = invoices.filter((iv) => {
    if (status !== "All" && iv.status !== status) return false;
    if (query && !iv.number.toLowerCase().includes(query.toLowerCase())) return false;
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
              {s !== "All" && <span className="ml-1.5 text-[11px] opacity-70">{invoices.filter((iv) => iv.status === s).length}</span>}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice #…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((iv) => {
                const project = projects.find((p) => p.id === iv.projectId);
                const client = clients.find((c) => c.id === iv.clientId);
                return (
                  <tr key={iv.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink-800 whitespace-nowrap">{iv.number}</td>
                    <td className="px-4 py-3 text-ink-600 max-w-[200px] truncate">
                      {project && <Link href={`/projects/${project.id}`} className="hover:text-blue-600 hover:underline">{project.name}</Link>}
                    </td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{client?.company}</td>
                    <td className="px-4 py-3 font-medium text-ink-800 whitespace-nowrap">{formatCurrency(iv.amount)}</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(iv.issueDate)}</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(iv.dueDate)}</td>
                    <td className="px-4 py-3"><InvoiceStatusBadge status={iv.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
