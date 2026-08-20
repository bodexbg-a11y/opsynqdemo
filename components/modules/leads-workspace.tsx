"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Mail, Phone, Trash2, UserPlus, Inbox, ExternalLink } from "lucide-react";
import { LEAD_STATUSES } from "@/lib/data/constants";
import { updateLeadStatusAction, deleteLeadAction, convertLeadToClientAction } from "@/lib/actions-leads";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import {
  SearchInput,
  FilterPills,
  FilterSelectPairs,
  ClearFiltersButton,
  SortHeader,
  nextSort,
  compareValues,
} from "@/components/ui/filter-bar";
import { cn } from "@/lib/utils";

export interface LeadRow {
  id: string;
  fbLeadId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  message: string | null;
  campaignName: string | null;
  adSetName: string | null;
  adName: string | null;
  platform: string | null;
  isOrganic: boolean;
  status: string;
  clientId: string | null;
  createdTime: string;
  syncedAt: string;
  fields: { name: string; value: string }[];
}

type StatusFilter = "All" | (typeof LEAD_STATUSES)[number];
type SortKey = "fullName" | "campaignName" | "createdTime" | "status";

const STATUS_TONE: Record<string, string> = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-warning-100 text-warning-500",
  Qualified: "bg-navy-800 text-white",
  Won: "bg-success-100 text-success-500",
  Lost: "bg-ink-100 text-ink-500",
};

/**
 * Relative age, so an unworked lead's staleness is obvious at a glance. Always
 * relative — the exact date is printed beside it, and repeating it there reads
 * as a bug.
 */
function age(iso: string): string {
  const hours = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

export function LeadsWorkspace({ leads, connected }: { leads: LeadRow[]; connected: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [campaign, setCampaign] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({ key: "createdTime", dir: "desc" });
  const [expanded, setExpanded] = useState<string | null>(null);

  const campaigns = useMemo(() => {
    const names = [...new Set(leads.map((l) => l.campaignName).filter((n): n is string => Boolean(n)))].sort();
    return names.map((n) => ({ value: n, label: n }));
  }, [leads]);

  const counts = useMemo(() => {
    const out: Partial<Record<StatusFilter, number>> = { All: leads.length };
    for (const s of LEAD_STATUSES) out[s] = leads.filter((l) => l.status === s).length;
    return out;
  }, [leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = leads.filter((l) => {
      if (status !== "All" && l.status !== status) return false;
      if (campaign !== "All" && l.campaignName !== campaign) return false;
      if (q) {
        const haystack = [l.fullName, l.email, l.phone, l.companyName, l.campaignName, l.adName, l.message]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort.key) {
      const key = sort.key;
      rows.sort((a, b) => {
        const result = compareValues(a[key], b[key]);
        return sort.dir === "asc" ? result : -result;
      });
    }
    return rows;
  }, [leads, query, status, campaign, sort]);

  const filtersActive = query !== "" || status !== "All" || campaign !== "All";

  if (!leads.length) {
    return (
      <div className="card-surface rounded-2xl p-12 text-center">
        <Inbox className="w-8 h-8 text-ink-300 mx-auto mb-3" />
        <p className="text-[14px] font-medium text-ink-700">No leads stored yet</p>
        <p className="text-[12.5px] text-ink-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          {connected
            ? "Hit “Sync from Facebook” to pull every lead-form submission across all your ad accounts. Meta only keeps leads for 90 days — once synced, they stay here."
            : "Add a Facebook access token in Settings → Integrations, then sync to pull your lead-form submissions."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          value={status}
          options={["All", ...LEAD_STATUSES] as StatusFilter[]}
          onChange={setStatus}
          counts={counts}
        />
        <div className="flex flex-wrap items-center gap-2">
          {campaigns.length > 1 && (
            <FilterSelectPairs label="Campaign" value={campaign} options={campaigns} onChange={setCampaign} allLabel="All campaigns" />
          )}
          <SearchInput value={query} onChange={setQuery} placeholder="Search leads…" className="w-56" />
          <ClearFiltersButton
            show={filtersActive}
            onClick={() => {
              setQuery("");
              setStatus("All");
              setCampaign("All");
            }}
          />
        </div>
      </div>

      <p className="text-[11.5px] text-ink-400">
        {filtered.length} of {leads.length} leads
      </p>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <SortHeader column="fullName" label="Lead" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort(nextSort(sort, c))} className="pl-5" />
                <th className="px-4 py-3 font-medium">Contact</th>
                <SortHeader column="campaignName" label="Source" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHeader column="createdTime" label="Submitted" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHeader column="status" label="Status" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort(nextSort(sort, c))} />
                <th className="px-4 py-3 font-medium text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const isOpen = expanded === lead.id;
                return (
                  <Fragment key={lead.id}>
                    <tr
                      className={cn(
                        "border-b border-ink-50 last:border-0 transition-colors",
                        isOpen ? "bg-ink-50/70" : "hover:bg-ink-50/60"
                      )}
                    >
                      <td className="pl-5 pr-4 py-3">
                        <button
                          onClick={() => setExpanded(isOpen ? null : lead.id)}
                          className="flex items-start gap-1.5 text-left group"
                          title="Show every field from the form"
                        >
                          <ChevronDown
                            className={cn("w-3.5 h-3.5 mt-0.5 text-ink-400 transition-transform shrink-0", isOpen && "rotate-180")}
                          />
                          <span>
                            <span className="font-medium text-ink-800 group-hover:text-blue-600">{lead.fullName}</span>
                            {lead.companyName && <span className="block text-[11.5px] text-ink-400">{lead.companyName}</span>}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-ink-600 hover:text-blue-600">
                              <Mail className="w-3 h-3 shrink-0" />
                              {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-ink-600 hover:text-blue-600">
                              <Phone className="w-3 h-3 shrink-0" />
                              {lead.phone}
                            </a>
                          )}
                          {!lead.email && !lead.phone && <span className="text-ink-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-700">{lead.campaignName ?? "—"}</p>
                        <p className="text-[11.5px] text-ink-400">
                          {lead.isOrganic ? "Organic" : lead.platform === "ig" ? "Instagram" : "Facebook"}
                          {lead.adName ? ` · ${lead.adName}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-ink-700">{age(lead.createdTime)}</p>
                        <p className="text-[11.5px] text-ink-400">{new Date(lead.createdTime).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusSelect leadId={lead.id} status={lead.status} />
                      </td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.clientId ? (
                            <Link
                              href={`/clients/${lead.clientId}`}
                              className="flex items-center gap-1 text-[11.5px] font-medium text-success-500 hover:underline whitespace-nowrap"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Client
                            </Link>
                          ) : (
                            <form action={convertLeadToClientAction}>
                              <input type="hidden" name="leadId" value={lead.id} />
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-[11.5px] font-medium text-blue-600 hover:bg-blue-50 rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                                title="Create a CRM client from this lead"
                              >
                                <UserPlus className="w-3 h-3" />
                                Convert
                              </button>
                            </form>
                          )}
                          <ConfirmDeleteForm
                            action={deleteLeadAction}
                            fields={{ leadId: lead.id }}
                            confirmMessage={`Delete the lead from ${lead.fullName}? The next sync will pull it back from Facebook if Meta still has it.`}
                          >
                            <button type="submit" className="text-ink-400 hover:text-danger-500 transition-colors p-1" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </ConfirmDeleteForm>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-ink-50 bg-ink-50/70">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 max-w-4xl">
                            {lead.fields.length ? (
                              lead.fields.map((f) => (
                                <div key={f.name} className="flex gap-3 text-[12px] border-b border-ink-100/70 py-1">
                                  <span className="text-ink-400 w-40 shrink-0">{f.name.replace(/_/g, " ")}</span>
                                  <span className="text-ink-700 break-words">{f.value || "—"}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[12px] text-ink-400">Meta returned no form fields for this lead.</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="neutral">Meta lead ID {lead.fbLeadId}</Badge>
                            {lead.adSetName && <Badge variant="neutral">Ad set: {lead.adSetName}</Badge>}
                            <Badge variant="neutral">Synced {age(lead.syncedAt)}</Badge>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  return (
    <form action={updateLeadStatusAction} className="inline-block">
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        title="Change lead status"
        className={cn(
          "text-[11px] font-medium rounded-md pl-2 pr-6 py-1 border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          STATUS_TONE[status] ?? STATUS_TONE.New
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 6px center",
        }}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
