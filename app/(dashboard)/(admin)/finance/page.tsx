import Link from "next/link";
import { getStore } from "@/lib/data/store";
import { getKpis, getRevenueSeries, getCashFlowSeries, projectProfitability } from "@/lib/data/analytics";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Tabs } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { InvoicesTable } from "@/components/modules/invoices-table";
import { ProjectFinanceExplorer } from "@/components/modules/project-finance-explorer";
import { DollarSign, TrendingUp, FileWarning, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export default async function FinancePage() {
  const store = await getStore();
  const { invoices, projects, clients, contracts, employees, tasks } = store;
  const kpis = getKpis(store);
  const revenue = getRevenueSeries(store);
  const cashFlow = getCashFlowSeries(store);

  const profitability = projects
    .map((p) => ({ p, ...projectProfitability(p) }))
    .sort((a, b) => a.profit - b.profit);

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Finance" subtitle="Revenue, expenses, invoices and project profitability" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue (YTD)" value={formatCurrency(kpis.revenue, { compact: true })} icon={DollarSign} tone="success" delta={12} />
        <KpiCard label="Profit" value={formatCurrency(kpis.profit, { compact: true })} icon={TrendingUp} tone="success" sub={`${kpis.profitMargin.toFixed(1)}% margin`} />
        <KpiCard label="Outstanding" value={formatCurrency(kpis.outstanding, { compact: true })} icon={FileWarning} tone="warning" />
        <KpiCard label="Cash Position" value={formatCurrency(cashFlow[cashFlow.length - 1]?.balance ?? 0, { compact: true })} icon={Wallet} tone="blue" />
      </div>

      <Tabs
        tabs={[
          {
            label: "Overview",
            content: (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Card>
                  <CardHeader title="Revenue" subtitle="Billed vs. collected, last 7 months" />
                  <div className="px-3 pb-4"><RevenueChart data={revenue} /></div>
                </Card>
                <Card>
                  <CardHeader title="Cash Flow" subtitle="Inflow, outflow & running balance" />
                  <div className="px-3 pb-4"><CashFlowChart data={cashFlow} /></div>
                </Card>
              </div>
            ),
          },
          {
            label: "By Project",
            content: (
              <ProjectFinanceExplorer
                projects={projects}
                invoices={invoices}
                contracts={contracts}
                clients={clients}
                employees={employees}
                tasks={tasks}
              />
            ),
          },
          {
            label: "Invoices",
            content: <InvoicesTable invoices={invoices} projects={projects} clients={clients} />,
          },
          {
            label: "Project Profitability",
            content: (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                        <th className="px-5 py-3 font-medium">Project</th>
                        <th className="px-4 py-3 font-medium">Budget</th>
                        <th className="px-4 py-3 font-medium">Spent</th>
                        <th className="px-4 py-3 font-medium">Profit</th>
                        <th className="px-4 py-3 font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitability.map(({ p, profit, margin }) => (
                        <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                          <td className="px-5 py-3 font-medium text-ink-800">
                            <Link href={`/projects/${p.id}`} className="hover:text-blue-600 hover:underline">{p.name}</Link>
                          </td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatCurrency(p.budget, { compact: true })}</td>
                          <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatCurrency(p.spent, { compact: true })}</td>
                          <td className={cn("px-4 py-3 font-medium whitespace-nowrap", profit >= 0 ? "text-success-500" : "text-danger-500")}>
                            {profit >= 0 ? "+" : ""}{formatCurrency(profit, { compact: true })}
                          </td>
                          <td className={cn("px-4 py-3 font-medium", margin >= 0 ? "text-success-500" : "text-danger-500")}>{margin.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
