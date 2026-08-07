import { getStore } from "@/lib/data/store";
import { getProjectStatusDistribution, getTeamProductivity, projectProfitability } from "@/lib/data/analytics";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { ProjectStatusDonut } from "@/components/charts/project-status-donut";
import { TeamProductivityChart } from "@/components/charts/team-productivity-chart";
import { Building2, Wallet, HardHat, Truck, FileBarChart, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const { projects, teams, equipment, employees } = getStore();
  const statusDist = getProjectStatusDistribution();
  const teamProductivity = getTeamProductivity();
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalProfit = projects.reduce((s, p) => s + projectProfitability(p).profit, 0);
  const maintenanceEquip = equipment.filter((e) => e.status === "Maintenance").length;
  const avgPerformance = Math.round(teams.reduce((s, t) => s + t.performanceScore, 0) / teams.length);

  const reportCards = [
    { title: "Project Portfolio Report", icon: Building2, desc: `${projects.length} projects, status & risk breakdown` },
    { title: "Financial Summary Report", icon: Wallet, desc: `${formatCurrency(totalBudget, { compact: true })} total contract value` },
    { title: "Workforce Performance Report", icon: HardHat, desc: `${teams.length} crews, ${employees.length} employees` },
    { title: "Equipment Utilization Report", icon: Truck, desc: `${equipment.length} assets, ${maintenanceEquip} in maintenance` },
  ];

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Reports" subtitle="Company-wide reporting across projects, finance, teams and equipment" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportCards.map((r) => (
          <Card key={r.title} className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <r.icon className="w-4.5 h-4.5" />
              </div>
              <Download className="w-3.5 h-3.5 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[13.5px] font-semibold text-ink-900 mt-3">{r.title}</p>
            <p className="text-[11.5px] text-ink-400 mt-1">{r.desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-1">
          <CardHeader title="Project Reports" subtitle="Portfolio status distribution" />
          <div className="px-5 pb-5 pt-2"><ProjectStatusDonut data={statusDist} /></div>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader title="Team Reports" subtitle={`Avg performance score: ${avgPerformance}/100`} />
          <div className="px-3 pb-4 pt-1"><TeamProductivityChart data={teamProductivity} /></div>
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
              <p className={`text-[20px] font-semibold mt-1 ${totalProfit >= 0 ? "text-success-500" : "text-danger-500"}`}>{formatCurrency(totalProfit, { compact: true })}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 flex items-center justify-between flex-wrap gap-4 bg-gradient-to-br from-navy-900 to-navy-800 text-white border-navy-800">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-blue-300" />
          <div>
            <p className="text-[14px] font-semibold">Custom Reports</p>
            <p className="text-[12.5px] text-ink-300 mt-0.5">Build a tailored report by combining any metrics across projects, finance, teams and equipment.</p>
          </div>
        </div>
        <button className="bg-white text-navy-900 text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-ink-50 transition-colors">Create Report</button>
      </Card>
    </div>
  );
}
