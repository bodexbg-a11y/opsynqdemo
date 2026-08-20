import Link from "next/link";
import { AlertTriangle, Wallet, Users, Target, TrendingUp, Eye, MousePointerClick, Megaphone, Inbox } from "lucide-react";
import { explainGraphError, type GraphError } from "@/lib/facebook/client";
import { DATE_PRESETS, ACCOUNT_STATUS, type FacebookState, type FbMetrics } from "@/lib/facebook/marketing";
import { Card, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { cn, formatNumber } from "@/lib/utils";

/** Meta reports money in the account's own currency, so format with that. */
function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Budgets come back as minor units (cents) in string form. */
function budget(raw: string | undefined, currency: string) {
  if (!raw) return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  return money(n / 100, currency);
}

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  ARCHIVED: "neutral",
  DELETED: "neutral",
  CAMPAIGN_PAUSED: "warning",
  ADSET_PAUSED: "warning",
  IN_PROCESS: "neutral",
  WITH_ISSUES: "danger",
  DISAPPROVED: "danger",
  PENDING_REVIEW: "neutral",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ").toLowerCase()}</Badge>;
}

function GraphErrorPanel({ error, title }: { error: GraphError; title: string }) {
  return (
    <Card className="p-6">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-danger-500">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {title}
      </p>
      <p className="text-[13px] text-ink-700 mt-2">{error.message}</p>
      <p className="text-[12.5px] text-ink-500 mt-2">{explainGraphError(error)}</p>
      <p className="text-[11px] text-ink-400 mt-3 font-mono">
        {[
          error.code !== undefined && `code ${error.code}`,
          error.error_subcode !== undefined && `subcode ${error.error_subcode}`,
          error.status !== undefined && `HTTP ${error.status}`,
          error.fbtrace_id && `trace ${error.fbtrace_id}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <Link
        href="/settings?tab=Integrations"
        className="inline-block mt-4 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors"
      >
        Open connection settings
      </Link>
    </Card>
  );
}

/** Account + date-range pickers, driven by URL params so they work without JS. */
function Toolbar({ state, accountId, datePreset }: { state: Extract<FacebookState, { status: "connected" }>; accountId: string; datePreset: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form method="get" className="flex flex-wrap items-center gap-2">
        <select
          name="account"
          defaultValue={accountId}
          className="appearance-none cursor-pointer rounded-lg border border-ink-200 bg-white text-ink-700 pl-3 pr-8 py-1.5 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          {state.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
        <select
          name="range"
          defaultValue={datePreset}
          className="appearance-none cursor-pointer rounded-lg border border-ink-200 bg-white text-ink-700 pl-3 pr-8 py-1.5 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-[12.5px] font-medium bg-navy-900 hover:bg-navy-800 text-white rounded-lg px-3 py-1.5 transition-colors"
        >
          Apply
        </button>
      </form>
      <Link href="/settings?tab=Integrations" className="ml-auto text-[12.5px] font-medium text-ink-500 hover:text-blue-600 px-2 py-1.5">
        Connection settings
      </Link>
    </div>
  );
}

export function FacebookDashboard({
  state,
  accountId,
  datePreset,
}: {
  state: FacebookState;
  accountId: string;
  datePreset: string;
}) {
  if (state.status === "error") {
    return <GraphErrorPanel error={state.error} title="Couldn't load your Facebook ad accounts" />;
  }

  if (state.status === "connected" && state.snapshotError) {
    return (
      <div className="space-y-4">
        <Toolbar state={state} accountId={accountId} datePreset={datePreset} />
        <GraphErrorPanel error={state.snapshotError} title="Couldn't load campaigns for this ad account" />
      </div>
    );
  }

  if (state.status !== "connected" || !state.snapshot) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[14px] font-semibold text-ink-900">No ad accounts found</p>
        <p className="text-[12.5px] text-ink-500 mt-1.5 max-w-md mx-auto">
          The token is valid but no ad accounts are visible to it. Check that it has the <code>ads_read</code> permission and
          access to an account in Business Manager.
        </p>
        <Link
          href="/settings?tab=Integrations"
          className="inline-block mt-4 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors"
        >
          Open connection settings
        </Link>
      </Card>
    );
  }

  const { account, totals, campaigns, adSets, ads, leads, warnings } = state.snapshot;
  const currency = account.currency || "USD";

  const active = campaigns.filter((c) => c.effective_status === "ACTIVE").length;
  const sorted = [...campaigns].sort((a, b) => b.metrics.spend - a.metrics.spend);
  const adSetsByCampaign = new Map<string, number>();
  for (const s of adSets) adSetsByCampaign.set(s.campaign_id, (adSetsByCampaign.get(s.campaign_id) ?? 0) + 1);
  const adsByCampaign = new Map<string, number>();
  for (const a of ads) adsByCampaign.set(a.campaign_id, (adsByCampaign.get(a.campaign_id) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <Toolbar state={state} accountId={accountId} datePreset={datePreset} />

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
        <Badge variant={account.account_status === 1 ? "success" : "warning"}>
          {ACCOUNT_STATUS[account.account_status] ?? `Status ${account.account_status}`}
        </Badge>
        <span>
          {account.name} · ID {account.account_id} · {currency}
          {account.timezone_name && ` · ${account.timezone_name}`}
        </span>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-100 px-4 py-3 space-y-1">
          {warnings.map((w) => (
            <p key={w} className="text-[12.5px] text-ink-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning-500" />
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ad Spend" value={money(totals.spend, currency)} icon={Wallet} tone="blue" sub={`${campaigns.length} campaigns · ${active} active`} />
        <KpiCard label="Leads" value={formatNumber(totals.leads)} icon={Users} tone="success" sub={totals.leads > 0 ? `${money(totals.costPerLead, currency)} per lead` : "No leads in range"} />
        <KpiCard label="Conversions" value={formatNumber(totals.conversions)} icon={Target} tone="success" sub={`${formatNumber(totals.clicks)} clicks`} />
        <KpiCard
          label="ROAS"
          value={totals.roas > 0 ? `${totals.roas.toFixed(2)}x` : "—"}
          icon={TrendingUp}
          tone={totals.roas >= 2 ? "success" : totals.roas > 0 ? "warning" : "neutral"}
          sub={totals.conversionValue > 0 ? `${money(totals.conversionValue, currency)} value` : "No revenue tracked"}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat icon={Eye} label="Impressions" value={formatNumber(totals.impressions)} />
        <MiniStat icon={MousePointerClick} label="CTR" value={`${totals.ctr.toFixed(2)}%`} />
        <MiniStat icon={Wallet} label="CPC" value={money(totals.cpc, currency)} />
        <MiniStat icon={Users} label="Reach" value={formatNumber(totals.reach)} />
      </div>

      <Tabs
        tabs={[
          {
            label: `Campaigns (${campaigns.length})`,
            id: "campaigns",
            content: (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                        <th className="px-5 py-3 font-medium">Campaign</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Objective</th>
                        <th className="px-4 py-3 font-medium">Budget</th>
                        <th className="px-4 py-3 font-medium">Spend</th>
                        <th className="px-4 py-3 font-medium">Impr.</th>
                        <th className="px-4 py-3 font-medium">Clicks</th>
                        <th className="px-4 py-3 font-medium">CTR</th>
                        <th className="px-4 py-3 font-medium">CPC</th>
                        <th className="px-4 py-3 font-medium">Leads</th>
                        <th className="px-4 py-3 font-medium">CPL</th>
                        <th className="px-4 py-3 font-medium">ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((c) => (
                        <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-medium text-ink-800">{c.name}</p>
                            <p className="text-ink-400 text-[11px] mt-0.5">
                              {adSetsByCampaign.get(c.id) ?? 0} ad sets · {adsByCampaign.get(c.id) ?? 0} ads
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={c.effective_status} />
                          </td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                            {c.objective ? c.objective.replace(/^OUTCOME_/, "").replace(/_/g, " ").toLowerCase() : "—"}
                          </td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                            {c.daily_budget ? `${budget(c.daily_budget, currency)}/day` : budget(c.lifetime_budget, currency)}
                          </td>
                          <td className="px-4 py-3 font-medium text-ink-800 whitespace-nowrap">{money(c.metrics.spend, currency)}</td>
                          <td className="px-4 py-3 text-ink-600">{formatNumber(c.metrics.impressions)}</td>
                          <td className="px-4 py-3 text-ink-600">{formatNumber(c.metrics.clicks)}</td>
                          <td className="px-4 py-3 text-ink-600">{c.metrics.ctr.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{money(c.metrics.cpc, currency)}</td>
                          <td className="px-4 py-3 font-medium text-ink-800">{formatNumber(c.metrics.leads)}</td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                            {c.metrics.leads > 0 ? money(c.metrics.costPerLead, currency) : "—"}
                          </td>
                          <td className={cn("px-4 py-3 font-medium", c.metrics.roas >= 2 ? "text-success-500" : c.metrics.roas > 0 ? "text-warning-500" : "text-ink-400")}>
                            {c.metrics.roas > 0 ? `${c.metrics.roas.toFixed(2)}x` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {campaigns.length === 0 && (
                  <div className="p-10 text-center text-ink-400 text-[13px]">This ad account has no campaigns.</div>
                )}
              </Card>
            ),
          },
          {
            label: `Ad Sets (${adSets.length})`,
            id: "adsets",
            content: (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                        <th className="px-5 py-3 font-medium">Ad Set</th>
                        <th className="px-4 py-3 font-medium">Campaign</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Optimising For</th>
                        <th className="px-4 py-3 font-medium">Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adSets.map((s) => (
                        <tr key={s.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                          <td className="px-5 py-3 font-medium text-ink-800">{s.name}</td>
                          <td className="px-4 py-3 text-ink-500">{campaigns.find((c) => c.id === s.campaign_id)?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.effective_status} />
                          </td>
                          <td className="px-4 py-3 text-ink-600">
                            {s.optimization_goal ? s.optimization_goal.replace(/_/g, " ").toLowerCase() : "—"}
                          </td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                            {s.daily_budget ? `${budget(s.daily_budget, currency)}/day` : budget(s.lifetime_budget, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {adSets.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No ad sets found.</div>}
              </Card>
            ),
          },
          {
            label: `Ads (${ads.length})`,
            id: "ads",
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ads.map((a) => (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {a.creative?.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.creative.thumbnail_url} alt={a.name} className="w-14 h-14 rounded-lg object-cover shrink-0 border border-ink-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-ink-100 text-ink-400 flex items-center justify-center shrink-0">
                          <Megaphone className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink-800 truncate">{a.name}</p>
                        <p className="text-[11.5px] text-ink-400 truncate mt-0.5">
                          {campaigns.find((c) => c.id === a.campaign_id)?.name ?? "—"}
                        </p>
                        <div className="mt-2">
                          <StatusBadge status={a.effective_status} />
                        </div>
                      </div>
                    </div>
                    {(a.creative?.title || a.creative?.body) && (
                      <div className="mt-3 pt-3 border-t border-ink-50">
                        {a.creative.title && <p className="text-[12px] font-medium text-ink-700">{a.creative.title}</p>}
                        {a.creative.body && <p className="text-[11.5px] text-ink-500 mt-1 line-clamp-3">{a.creative.body}</p>}
                      </div>
                    )}
                  </Card>
                ))}
                {ads.length === 0 && (
                  <Card className="p-10 text-center text-ink-400 text-[13px] md:col-span-2 xl:col-span-3">No ads found.</Card>
                )}
              </div>
            ),
          },
          {
            label: `Leads (${leads.length})`,
            id: "leads",
            content: (
              <Card className="overflow-hidden">
                <CardHeader
                  title="Lead form submissions"
                  subtitle={
                    leads.length
                      ? "A live read of your most recent lead-gen ads — nothing here is stored yet"
                      : "No lead records retrieved — this needs the leads_retrieval permission, and only lead-gen ads have submissions"
                  }
                  action={
                    <Link
                      href="/leads"
                      className="flex items-center gap-1.5 text-[12.5px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      Open Leads CRM
                    </Link>
                  }
                />
                {leads.length > 0 && (
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-y border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                          <th className="px-5 py-2.5 font-medium">Submitted</th>
                          <th className="px-4 py-2.5 font-medium">Ad</th>
                          <th className="px-4 py-2.5 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((l) => (
                          <tr key={l.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                            <td className="px-5 py-3 text-ink-600 whitespace-nowrap">
                              {new Date(l.created_time).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-ink-600">{l.ad_name ?? l.campaign_name ?? "—"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {l.fields.map((f) => (
                                  <span key={f.name} className="text-[12px]">
                                    <span className="text-ink-400">{f.name.replace(/_/g, " ")}:</span>{" "}
                                    <span className="text-ink-800 font-medium">{f.value}</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {leads.length === 0 && (
                  <div className="px-5 pb-6 pt-2 text-[12.5px] text-ink-500">
                    Lead <em>counts</em> above still come from Meta&apos;s insights and are accurate — only the individual
                    contact records need the extra permission.
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-[11px] text-ink-400 uppercase tracking-wide flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-[17px] font-semibold text-ink-900 mt-1">{value}</p>
    </Card>
  );
}

export type { FbMetrics };
