"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Phone, Mail } from "lucide-react";
import type { Subcontractor, Project, SubTrade } from "@/lib/data/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";

const TRADES: (SubTrade | "All")[] = ["All", "Electrical", "Roofing", "Concrete", "Painting", "Excavation", "Plumbing", "HVAC"];

export function SubcontractorsBoard({ subcontractors, projects }: { subcontractors: Subcontractor[]; projects: Project[] }) {
  const [trade, setTrade] = useState<(typeof TRADES)[number]>("All");
  const filtered = trade === "All" ? subcontractors : subcontractors.filter((s) => s.trade === trade);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TRADES.map((t) => (
          <button
            key={t}
            onClick={() => setTrade(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
              trade === t ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const activeProjects = projects.filter((p) => s.activeProjectIds.includes(p.id));
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">{s.company}</p>
                  <Badge variant="blue" className="mt-1.5">{s.trade}</Badge>
                </div>
                <Badge variant={s.status === "Active" ? "success" : "neutral"}>{s.status}</Badge>
              </div>

              <div className="flex items-center gap-1 mt-3 text-warning-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(s.rating) ? "fill-warning-500" : "fill-none text-ink-200")} />
                ))}
                <span className="text-[12px] text-ink-500 ml-1">{s.rating.toFixed(1)}</span>
              </div>

              <div className="mt-3 space-y-1.5 text-[12px] text-ink-500">
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.phone}</div>
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{s.email}</div>
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
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
