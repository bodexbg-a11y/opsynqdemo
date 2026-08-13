import { getStore } from "@/lib/data/store";
import { getProjectStatusDistribution, getTeamProductivity, projectProfitability } from "@/lib/data/analytics";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { ProjectStatusDonut } from "@/components/charts/project-status-donut";
import { TeamProductivityChart } from "@/components/charts/team-productivity-chart";
import { Building2, Wallet, HardHat, Truck, FileBarChart, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const store = await getStore();
  const { projects, teams, equipment, employees, materials, warehouses, invoices } = store;
  const statusDist = getProjectStatusDistribution(store);
  const teamProductivity = getTeamProductivity(store);
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalProfit = projects.reduce((s, p) => s + projectProfitability(p).profit, 0);
  const maintenanceEquip = equipment.filter((e) => e.status === "Maintenance").length;
  const avgPerformance = Math.round(teams.reduce((s, t) => s + t.performanceScore, 0) / (teams.length || 1));
  const inventoryValue = materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);

  const reportCards = [
    {
      type: "portfolio",
      title: "Project Portfolio Report",
      icon: Building2,
      desc: `${projects.length} projects, status & risk breakdown`,
      sheets: "Summary · Projects · Status Breakdown",
    },
    {
      type: "financial",
      title: "Financial Summary Report",
      icon: Wallet,
      desc: `${formatCurrency(totalBudget, { compact: true })} total contract value · ${invoices.length} invoices`,
      sheets: "Summary · Project P&L · Invoices",
    },
    {
      type: "workforce",
      title: "Workforce Performance Report",
      icon: HardHat,
      desc: `${teams.length} crews, ${employees.length} employees`,
      sheets: "Summary · Employees · Crews · Productivity · Task Load",
    },
    {
      type: "equipment",
      title: "Equipment & Inventory Report",
      icon: Truck,
      desc: `${equipment.length} assets · ${warehouses.length} warehouses · ${formatCurrency(inventoryValue, { compact: true })} stock`,
      sheets: "Summary · Equipment · Warehouses · Inventory",
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Reports"
        subtitle="Generate real Excel reports across projects, finance, teams and equipment"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportCards.map((r) => (
          <a
            key={r.type}
            href={`/api/reports/${r.type}`}
            className="block card-surface rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <r.icon className="w-4.5 h-4.5" />
              </div>
              <Download className="w-3.5 h-3.5 text-ink-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-[13.5px] font-semibold text-ink-900 mt-3">{r.title}</p>
            <p className="text-[11.5px] text-ink-400 mt-1">{r.desc}</p>
            <p className="text-[10.5px] text-ink-300 mt-2 pt-2 border-t border-ink-50">{r.sheets}</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-1">
          <CardHeader title="Project Reports" subtitle="Portfolio status distribution" />
          <div className="px-5 pb-5 pt-2">
            <ProjectStatusDonut data={statusDist} />
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader title="Team Reports" subtitle={`Avg performance score: ${avgPerformance}/100`} />
          <div className="px-3 pb-4 pt-1">
            <TeamProductivityChart data={teamProductivity} />
          </div>
        </Card>
        <Card className="xl:col-span-1 p-5">
          <CardHeader title="Financial Reports" subtitle="Portfolio-wide profitability" className="px-0 pt-0" />
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Total Contract Value</p>
              <p className="text-[20px] font-semibold text-ink-900 mt-1">{formatCurrency(totalBudget, { compact: true })}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Portfolio Profit</p>
              <p className={`text-[20px] font-semibold mt-1 ${totalProfit >= 0 ? "text-success-500" : "text-danger-500"}`}>
                {formatCurrency(totalProfit, { compact: true })}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Equipment in Maintenance</p>
              <p className="text-[20px] font-semibold text-ink-900 mt-1">{maintenanceEquip}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 flex items-center justify-between flex-wrap gap-4 bg-gradient-to-br from-navy-900 to-navy-800 text-white border-navy-800">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-blue-300" />
          <div>
            <p className="text-[14px] font-semibold">Every report is a live export</p>
            <p className="text-[12.5px] text-ink-300 mt-0.5">
              Each card downloads a multi-sheet Excel workbook generated from your current data — no stale snapshots.
            </p>
          </div>
        </div>
        {/* A real <a> is required here: this is a file download, and next/link would
            client-side navigate instead of letting the browser save the workbook. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/reports/portfolio"
          className="bg-white text-navy-900 text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-ink-50 transition-colors"
        >
          Download Portfolio Report
        </a>
      </Card>
    </div>
  );
}
