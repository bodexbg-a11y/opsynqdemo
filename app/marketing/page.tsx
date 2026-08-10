import { getStore } from "@/lib/data/store";
import { getCampaignKpis, getCampaignSpendByPlatform, getCampaignSpendSeries } from "@/lib/data/analytics";
import { answerCampaignPerformance, answerUnderperformingCampaigns } from "@/lib/data/ai";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { CampaignSpendChart } from "@/components/charts/campaign-spend-chart";
import { CampaignsTable } from "@/components/modules/campaigns-table";
import { Wallet, Users, Target, TrendingUp, Sparkles } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function MarketingPage() {
  const store = await getStore();
  const { adCampaigns, projects } = store;
  const kpis = getCampaignKpis(store);
  const byPlatform = getCampaignSpendByPlatform(store);
  const spendSeries = getCampaignSpendSeries(store);
  const performanceSummary = answerCampaignPerformance(store);
  const underperformers = answerUnderperformingCampaigns(store);

  const facebook = byPlatform.find((p) => p.platform === "Facebook");
  const google = byPlatform.find((p) => p.platform === "Google");

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Marketing"
        subtitle={`${kpis.totalCampaigns} campaigns synced from Facebook Ads + Google Ads · ${kpis.activeCampaigns} currently active`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Ad Spend" value={formatCurrency(kpis.totalSpend, { compact: true })} icon={Wallet} tone="blue" />
        <KpiCard label="Leads Generated" value={formatNumber(kpis.totalLeads)} icon={Users} tone="success" />
        <KpiCard label="Conversions" value={formatNumber(kpis.totalConversions)} icon={Target} tone="success" />
        <KpiCard label="Blended ROAS" value={`${kpis.blendedRoas.toFixed(2)}x`} icon={TrendingUp} tone={kpis.blendedRoas >= 2 ? "success" : "warning"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Ad Spend by Platform" subtitle="Facebook Ads vs. Google Ads, last 7 months" />
          <div className="px-3 pb-4"><CampaignSpendChart data={spendSeries} /></div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Platform Breakdown" subtitle="Current totals" className="px-0 pt-0" />
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#1877F2]/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-[#1877F2] text-white flex items-center justify-center text-[12px] font-bold">f</span>
                <div>
                  <p className="text-[12.5px] font-medium text-ink-800">Facebook Ads</p>
                  <p className="text-[11px] text-ink-400">{facebook?.leads ?? 0} leads · {facebook?.conversions ?? 0} conv.</p>
                </div>
              </div>
              <p className="text-[14px] font-semibold text-ink-900">{formatCurrency(facebook?.spend ?? 0, { compact: true })}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#34A853]/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] text-white flex items-center justify-center text-[12px] font-bold">G</span>
                <div>
                  <p className="text-[12.5px] font-medium text-ink-800">Google Ads</p>
                  <p className="text-[11px] text-ink-400">{google?.leads ?? 0} leads · {google?.conversions ?? 0} conv.</p>
                </div>
              </div>
              <p className="text-[14px] font-semibold text-ink-900">{formatCurrency(google?.spend ?? 0, { compact: true })}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-6 bg-gradient-to-br from-navy-900 to-navy-800 text-white border-navy-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <h3 className="text-[14px] font-semibold">AI Performance Summary</h3>
          </div>
          <p className="text-[13px] text-ink-200 leading-relaxed whitespace-pre-line">{performanceSummary}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h3 className="text-[14px] font-semibold text-ink-900">Underperforming Campaigns</h3>
          </div>
          <p className="text-[13px] text-ink-600 leading-relaxed whitespace-pre-line">{underperformers}</p>
        </Card>
      </div>

      <CampaignsTable campaigns={adCampaigns} projects={projects} />
    </div>
  );
}
