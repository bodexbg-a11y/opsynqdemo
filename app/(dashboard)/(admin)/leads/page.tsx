import Link from "next/link";
import { Inbox, UserCheck, Clock, TrendingUp, AlertTriangle, CheckCircle2, PlugZap } from "lucide-react";
import { prisma } from "@/lib/db";
import { getFacebookToken } from "@/lib/facebook/client";
import { PageHeader, Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { LeadsWorkspace, type LeadRow } from "@/components/modules/leads-workspace";
import { SyncLeadsButton } from "@/components/modules/sync-leads-button";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; ads?: string; accounts?: string; error?: string; warn?: string }>;
}) {
  const { created, updated, ads, accounts, error, warn } = await searchParams;

  const [rows, token] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdTime: "desc" } }),
    getFacebookToken(),
  ]);

  const leads: LeadRow[] = rows.map((l) => ({
    id: l.id,
    fbLeadId: l.fbLeadId,
    fullName: l.fullName,
    email: l.email,
    phone: l.phone,
    companyName: l.companyName,
    message: l.message,
    campaignName: l.campaignName,
    adSetName: l.adSetName,
    adName: l.adName,
    platform: l.platform,
    isOrganic: l.isOrganic,
    status: l.status,
    clientId: l.clientId,
    createdTime: l.createdTime.toISOString(),
    syncedAt: l.syncedAt.toISOString(),
    fields: (l.rawFields as { name: string; value: string }[] | null) ?? [],
  }));

  const newCount = leads.filter((l) => l.status === "New").length;
  const wonCount = leads.filter((l) => l.status === "Won").length;
  const convertedCount = leads.filter((l) => l.clientId).length;
  const lastSync = leads.reduce<string | null>((latest, l) => (!latest || l.syncedAt > latest ? l.syncedAt : latest), null);

  const didSync = created !== undefined || updated !== undefined;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Leads"
        subtitle={
          token
            ? `${leads.length} lead${leads.length === 1 ? "" : "s"} captured from Facebook ad forms${
                lastSync ? ` · last synced ${new Date(lastSync).toLocaleString()}` : ""
              }`
            : "Connect Facebook to start capturing lead-form submissions"
        }
        action={
          token ? (
            <SyncLeadsButton />
          ) : (
            <Link
              href="/settings?tab=Integrations"
              className="flex items-center gap-1.5 text-[13px] font-medium bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg px-3 py-2 transition-colors"
            >
              <PlugZap className="w-4 h-4" />
              Connect Facebook
            </Link>
          )
        }
      />

      {error && (
        <Card className="p-4 border-danger-500/30 bg-danger-100/40">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-danger-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-ink-700 leading-relaxed">{error}</p>
          </div>
        </Card>
      )}

      {didSync && !error && (
        <Card className="p-4 border-success-500/30 bg-success-100/40">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
            <div className="text-[12.5px] text-ink-700 leading-relaxed">
              <p>
                Synced <strong>{created ?? 0}</strong> new and refreshed <strong>{updated ?? 0}</strong> existing lead
                {updated === "1" ? "" : "s"} across {accounts ?? 0} ad account{accounts === "1" ? "" : "s"} and {ads ?? 0} ad
                {ads === "1" ? "" : "s"}.
              </p>
              {warn && <p className="text-warning-500 mt-1">{warn}</p>}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={String(leads.length)} icon={Inbox} tone="blue" />
        <KpiCard label="Unworked" value={String(newCount)} icon={Clock} tone={newCount > 0 ? "warning" : "neutral"} />
        <KpiCard label="Converted to Clients" value={String(convertedCount)} icon={UserCheck} tone="success" />
        <KpiCard
          label="Won"
          value={String(wonCount)}
          icon={TrendingUp}
          tone={wonCount > 0 ? "success" : "neutral"}
          sub={leads.length ? `${((wonCount / leads.length) * 100).toFixed(0)}% of all leads` : undefined}
        />
      </div>

      <LeadsWorkspace leads={leads} connected={Boolean(token)} />
    </div>
  );
}
