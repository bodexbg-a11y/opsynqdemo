import {
  Building2,
  AlertTriangle,
  ListChecks,
  HardHat,
  DollarSign,
  TrendingUp,
  FileWarning,
  Wallet,
  Sparkles,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { getStore } from "@/lib/data/store";
import {
  getKpis,
  getRevenueSeries,
  getCashFlowSeries,
  getProjectStatusDistribution,
  getProjectProgressData,
  getTeamProductivity,
  getUpcomingDeadlines,
  getTodaysTasks,
  getAiInsights,
} from "@/lib/data/analytics";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { ProjectStatusDonut } from "@/components/charts/project-status-donut";
import { ProjectProgressChart } from "@/components/charts/project-progress-chart";
import { TeamProductivityChart } from "@/components/charts/team-productivity-chart";
import { ProjectStatusBadge, PriorityBadge } from "@/components/ui/badge";
import { SeverityDot } from "@/components/ui/severity-dot";
import { AvatarStack } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { employees, projects } = getStore();
  const kpis = getKpis();
  const revenue = getRevenueSeries();
  const cashFlow = getCashFlowSeries();
  const statusDist = getProjectStatusDistribution();
  const progressData = getProjectProgressData();
  const teamProductivity = getTeamProductivity();
  const deadlines = getUpcomingDeadlines(5);
  const todaysTasks = getTodaysTasks(6);
  const insights = getAiInsights();

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Good morning, Vlad"
        subtitle="Here's the state of the company across every active job site — as of August 7, 2026."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Projects" value={String(kpis.activeProjects)} icon={Building2} tone="blue" delta={8} sub="vs last month" />
        <KpiCard label="Behind Schedule" value={String(kpis.behindSchedule)} icon={AlertTriangle} tone="danger" delta={-3} sub="vs last month" />
        <KpiCard label="Today's Tasks" value={String(kpis.todaysTasks)} icon={ListChecks} tone="neutral" sub="due today" />
        <KpiCard label="Active Crews" value={String(kpis.activeTeams)} icon={HardHat} tone="blue" sub="on site now" />
        <KpiCard label="Revenue (YTD)" value={formatCurrency(kpis.revenue, { compact: true })} icon={DollarSign} tone="success" delta={12} sub="vs last month" />
        <KpiCard label="Profit" value={formatCurrency(kpis.profit, { compact: true })} icon={TrendingUp} tone="success" sub={`${kpis.profitMargin.toFixed(1)}% margin`} />
        <KpiCard label="Outstanding Invoices" value={formatCurrency(kpis.outstanding, { compact: true })} icon={FileWarning} tone="warning" sub="pending + overdue" />
        <KpiCard label="Cash Position" value={formatCurrency(cashFlow[cashFlow.length - 1]?.balance ?? 0, { compact: true })} icon={Wallet} tone="blue" delta={5} sub="vs last month" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue" subtitle="Billed vs. collected revenue, last 7 months" />
          <div className="px-3 pb-4">
            <RevenueChart data={revenue} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Project Status" subtitle="Portfolio distribution" />
          <div className="px-5 pb-5 pt-2">
            <ProjectStatusDonut data={statusDist} />
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-1">
          <CardHeader title="Project Progress" subtitle="Lowest progress, active jobs" />
          <div className="px-3 pb-4 pt-1">
            <ProjectProgressChart data={progressData} />
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader title="Team Productivity" subtitle="Top performing crews" />
          <div className="px-3 pb-4 pt-1">
            <TeamProductivityChart data={teamProductivity} />
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader title="Cash Flow" subtitle="Inflow, outflow & running balance" />
          <div className="px-3 pb-4 pt-1">
            <CashFlowChart data={cashFlow} />
          </div>
        </Card>
      </div>

      {/* Bottom row: AI insights, deadlines, tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-1 bg-gradient-to-br from-navy-900 to-navy-800 border-navy-800 text-white overflow-hidden relative">
          <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <h3 className="text-[14px] font-semibold">AI Insights</h3>
            </div>
            <Link href="/ai-assistant" className="text-[11.5px] text-blue-300 hover:text-blue-200 flex items-center gap-0.5">
              Ask AI <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-5 pb-5 pt-3 space-y-3">
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-3.5">
                <div className="flex items-start gap-2">
                  <SeverityDot severity={insight.severity} className="mt-1.5" />
                  <div>
                    <p className="text-[12.5px] font-medium text-white leading-snug">{insight.title}</p>
                    <p className="text-[11.5px] text-ink-300 mt-1 leading-relaxed">{insight.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader
            title="Upcoming Deadlines"
            subtitle="Next 5 milestones"
            action={
              <Link href="/scheduling" className="text-[12px] text-blue-600 font-medium flex items-center gap-0.5 hover:text-blue-700">
                Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="px-3 pb-3 pt-2">
            {deadlines.map((p) => (
              <Link href={`/projects/${p.id}`} key={p.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-ink-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink-800 truncate">{p.name}</p>
                  <p className="text-[11.5px] text-ink-400">{formatDate(p.deadline)}</p>
                </div>
                <ProjectStatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader
            title="Today's Tasks"
            subtitle="Across all active job sites"
            action={
              <Link href="/tasks" className="text-[12px] text-blue-600 font-medium flex items-center gap-0.5 hover:text-blue-700">
                Kanban <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="px-3 pb-3 pt-2">
            {todaysTasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              const assignees = employees.filter((e) => t.assigneeIds.includes(e.id)).map((e) => e.name);
              return (
                <Link href="/tasks" key={t.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-ink-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-ink-800 truncate">{t.title}</p>
                    <p className="text-[11.5px] text-ink-400 truncate">{project?.name}</p>
                  </div>
                  <AvatarStack names={assignees} max={2} />
                  <PriorityBadge priority={t.priority} />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
