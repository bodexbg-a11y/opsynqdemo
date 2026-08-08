"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { AdCampaign, Project } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

const PLATFORM_FILTERS = ["All", "Facebook", "Google"] as const;
const STATUS_FILTERS = ["All", "Active", "Paused", "Ended", "Draft"] as const;

function PlatformBadge({ platform }: { platform: AdCampaign["platform"] }) {
  const isFacebook = platform === "Facebook";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        isFacebook ? "bg-[#1877F2]/10 text-[#1877F2]" : "bg-[#34A853]/10 text-[#1e8e3e]"
      )}
    >
      <span className={cn("w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-white text-[9px] font-bold", isFacebook ? "bg-[#1877F2]" : "bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05]")}>
        {isFacebook ? "f" : "G"}
      </span>
      {isFacebook ? "Facebook Ads" : "Google Ads"}
    </span>
  );
}

const STATUS_TONE: Record<AdCampaign["status"], "success" | "warning" | "neutral"> = {
  Active: "success",
  Paused: "warning",
  Ended: "neutral",
  Draft: "neutral",
};

export function CampaignsTable({ campaigns, projects }: { campaigns: AdCampaign[]; projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORM_FILTERS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const filtered = campaigns.filter((c) => {
    if (platform !== "All" && c.platform !== platform) return false;
    if (status !== "All" && c.status !== status) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {PLATFORM_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
                  platform === p ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-colors border",
                  status === s ? "border-blue-400 text-blue-600 bg-blue-50" : "border-transparent text-ink-400 hover:bg-ink-100"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Spend</th>
                <th className="px-4 py-3 font-medium">CTR</th>
                <th className="px-4 py-3 font-medium">CPC</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Conversions</th>
                <th className="px-4 py-3 font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const project = c.projectId ? projects.find((p) => p.id === c.projectId) : null;
                return (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-800">{c.name}</p>
                      <p className="text-ink-400 text-[11px] mt-0.5">
                        {c.objective}
                        {project && (
                          <>
                            {" · "}
                            <Link href={`/projects/${project.id}`} className="hover:text-blue-600 hover:underline">
                              {project.name}
                            </Link>
                          </>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3"><PlatformBadge platform={c.platform} /></td>
                    <td className="px-4 py-3"><Badge variant={STATUS_TONE[c.status]}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-ink-700 font-medium whitespace-nowrap">{formatCurrency(c.spend, { compact: true })}</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{c.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatCurrency(c.cpc)}</td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatNumber(c.leads)}</td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatNumber(c.conversions)}</td>
                    <td className={cn("px-4 py-3 font-medium whitespace-nowrap", c.roas >= 2 ? "text-success-500" : c.roas >= 1 ? "text-warning-500" : "text-danger-500")}>
                      {c.roas.toFixed(2)}x
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No campaigns match your filters.</div>}
      </div>
    </div>
  );
}
