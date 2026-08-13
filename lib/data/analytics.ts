import type { Store } from "./generate";
import type { Project, Task, AdPlatform } from "./types";

const NOW = new Date("2026-08-07");

export function getKpis(store: Store) {
  const { projects, invoices, tasks, teams } = store;

  const activeProjects = projects.filter((p) => p.status === "In Progress" || p.status === "Behind Schedule");
  const behindSchedule = projects.filter((p) => p.status === "Behind Schedule");
  const revenue = invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const cashFlow = getCashFlowSeries(store);
  const profit = cashFlow.reduce((sum, m) => sum + (m.inflow - m.outflow), 0);
  const outstanding = invoices
    .filter((i) => i.status === "Overdue" || i.status === "Pending")
    .reduce((sum, i) => sum + i.amount, 0);
  const todaysTasks = tasks.filter((t) => {
    const d = new Date(t.dueDate);
    return d.toDateString() === NOW.toDateString() && t.status !== "Completed";
  });
  const activeTeams = teams.filter((t) => t.status === "On Site").length;

  return {
    activeProjects: activeProjects.length,
    behindSchedule: behindSchedule.length,
    todaysTasks: todaysTasks.length,
    activeTeams,
    revenue,
    profit,
    profitMargin: revenue ? (profit / revenue) * 100 : 0,
    outstanding,
    totalProjects: projects.length,
  };
}

export function getRevenueSeries(store: Store) {
  const { invoices } = store;
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const monthIdxBase = 1; // Feb = index 1
  return months.map((m, idx) => {
    const monthNum = monthIdxBase + idx;
    const monthInvoices = invoices.filter((i) => {
      const d = new Date(i.issueDate);
      return d.getFullYear() === 2026 && d.getMonth() === monthNum;
    });
    const revenue = monthInvoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
    const billed = monthInvoices.reduce((s, i) => s + i.amount, 0);
    const base = 180000 + idx * 22000;
    return {
      month: m,
      revenue: revenue + base,
      billed: billed + base * 1.15,
    };
  });
}

export function getCashFlowSeries(store: Store) {
  const revenueSeries = getRevenueSeries(store);
  let running = 420000;
  return revenueSeries.map((r, idx) => {
    const expenses = r.revenue * (0.62 + (idx % 3) * 0.03);
    running += r.revenue - expenses;
    return {
      month: r.month,
      inflow: Math.round(r.revenue),
      outflow: Math.round(expenses),
      balance: Math.round(running),
    };
  });
}

export function getProjectStatusDistribution(store: Store) {
  const { projects } = store;
  const statuses: Project["status"][] = ["In Progress", "Behind Schedule", "Planning", "On Hold", "Completed"];
  return statuses.map((status) => ({
    status,
    value: projects.filter((p) => p.status === status).length,
  }));
}

export function getProjectProgressData(store: Store) {
  const { projects } = store;
  return projects
    .filter((p) => p.status === "In Progress" || p.status === "Behind Schedule")
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 8)
    .map((p) => ({ name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name, progress: p.progress, status: p.status }));
}

export function getTeamProductivity(store: Store) {
  const { teams } = store;
  return [...teams]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 8)
    .map((t) => ({ name: t.name.replace("Crew ", ""), score: t.performanceScore, hours: t.avgWeeklyHours }));
}

export function getUpcomingDeadlines(store: Store, limit = 6) {
  const { projects } = store;
  return [...projects]
    .filter((p) => p.status !== "Completed" && new Date(p.deadline) > NOW)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, limit);
}

export function getTodaysTasks(store: Store, limit = 8) {
  const { tasks } = store;
  const upcoming = [...tasks]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return upcoming.slice(0, limit);
}

export function projectProfitability(p: Project) {
  const profit = p.budget - p.spent;
  const margin = p.budget ? (profit / p.budget) * 100 : 0;
  return { profit, margin };
}

export interface ProjectFinancials {
  project: Project;
  budget: number;
  spent: number;
  /** Budget left to spend before the job goes over. */
  remainingBudget: number;
  budgetUsedPct: number;
  invoicedToDate: number;
  /** Cash actually received — sum of paid invoices. */
  collected: number;
  /** Issued but not yet paid — pending plus overdue. */
  outstanding: number;
  overdue: number;
  /** Contract value signed for the job, which can exceed the working budget. */
  contractValue: number;
  profit: number;
  margin: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}

/** Full income/expense picture for one project — powers the Finance drill-down. */
export function getProjectFinancials(store: Store, projectId: string): ProjectFinancials | null {
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;

  const projectInvoices = store.invoices.filter((iv) => iv.projectId === projectId);
  const collected = projectInvoices.filter((iv) => iv.status === "Paid").reduce((s, iv) => s + iv.amount, 0);
  const overdueInvoices = projectInvoices.filter((iv) => iv.status === "Overdue");
  const overdue = overdueInvoices.reduce((s, iv) => s + iv.amount, 0);
  const outstanding = projectInvoices
    .filter((iv) => iv.status === "Pending" || iv.status === "Overdue")
    .reduce((s, iv) => s + iv.amount, 0);
  const contractValue = store.contracts.filter((c) => c.projectId === projectId).reduce((s, c) => s + c.value, 0);
  const { profit, margin } = projectProfitability(project);

  return {
    project,
    budget: project.budget,
    spent: project.spent,
    remainingBudget: project.budget - project.spent,
    budgetUsedPct: project.budget ? (project.spent / project.budget) * 100 : 0,
    invoicedToDate: project.invoicedToDate,
    collected,
    outstanding,
    overdue,
    contractValue,
    profit,
    margin,
    invoiceCount: projectInvoices.length,
    paidCount: projectInvoices.filter((iv) => iv.status === "Paid").length,
    overdueCount: overdueInvoices.length,
  };
}

export function getAiInsights(store: Store) {
  const { projects, invoices, teams } = store;
  const insights: { title: string; body: string; severity: "info" | "warning" | "critical" }[] = [];

  const losingMoney = projects.filter((p) => {
    const { profit } = projectProfitability(p);
    return profit < 0;
  });
  if (losingMoney.length) {
    insights.push({
      title: `${losingMoney.length} project${losingMoney.length > 1 ? "s are" : " is"} losing money`,
      body: `${losingMoney
        .slice(0, 3)
        .map((p) => p.name)
        .join(", ")} ${losingMoney.length > 3 ? `and ${losingMoney.length - 3} more ` : ""}showing negative margins. Review scope and change orders.`,
      severity: "critical",
    });
  }

  const behind = projects.filter((p) => p.status === "Behind Schedule");
  if (behind.length) {
    insights.push({
      title: `${behind.length} project${behind.length > 1 ? "s" : ""} at risk of missing deadline`,
      body: `${behind
        .slice(0, 3)
        .map((p) => p.name)
        .join(", ")} ${behind.length > 3 ? `and ${behind.length - 3} more ` : ""}are behind schedule. Consider reallocating crews.`,
      severity: "warning",
    });
  }

  const overdue = invoices.filter((i) => i.status === "Overdue");
  if (overdue.length) {
    const total = overdue.reduce((s, i) => s + i.amount, 0);
    insights.push({
      title: `$${total.toLocaleString()} in overdue invoices`,
      body: `${overdue.length} invoices are past due. Prioritize collections to protect cash flow.`,
      severity: "warning",
    });
  }

  const topTeam = [...teams].sort((a, b) => b.performanceScore - a.performanceScore)[0];
  if (topTeam) {
    insights.push({
      title: `${topTeam.name} is your top performing crew`,
      body: `Performance score of ${topTeam.performanceScore}/100 across ${topTeam.completedProjects} completed projects. Consider it for high-priority work.`,
      severity: "info",
    });
  }

  return insights;
}

export function findLosingProjects(store: Store) {
  const { projects } = store;
  return projects
    .map((p) => ({ p, ...projectProfitability(p) }))
    .filter((x) => x.profit < 0)
    .sort((a, b) => a.profit - b.profit);
}

export function findAtRiskProjects(store: Store) {
  const { projects } = store;
  return projects.filter((p) => p.status === "Behind Schedule" || p.riskLevel === "High");
}

export function rankTeamsByPerformance(store: Store) {
  const { teams } = store;
  return [...teams].sort((a, b) => b.performanceScore - a.performanceScore);
}

export function findOverdueInvoices(store: Store) {
  const { invoices } = store;
  return invoices.filter((i) => i.status === "Overdue").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getTaskCountsByStatus(store: Store) {
  const { tasks } = store;
  const statuses: Task["status"][] = ["To Do", "In Progress", "Blocked", "Completed"];
  return statuses.map((status) => ({ status, count: tasks.filter((t) => t.status === status).length }));
}

export function getCampaignKpis(store: Store) {
  const { adCampaigns } = store;
  const active = adCampaigns.filter((c) => c.status === "Active");
  const totalSpend = adCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = adCampaigns.reduce((s, c) => s + c.leads, 0);
  const totalConversions = adCampaigns.reduce((s, c) => s + c.conversions, 0);
  const blendedRoas = totalSpend ? adCampaigns.reduce((s, c) => s + c.roas * c.spend, 0) / totalSpend : 0;
  return {
    activeCampaigns: active.length,
    totalCampaigns: adCampaigns.length,
    totalSpend,
    totalLeads,
    totalConversions,
    blendedRoas,
  };
}

export function getCampaignSpendByPlatform(store: Store) {
  const { adCampaigns } = store;
  const platforms: AdPlatform[] = ["Facebook", "Google"];
  return platforms.map((platform) => {
    const items = adCampaigns.filter((c) => c.platform === platform);
    return {
      platform,
      spend: items.reduce((s, c) => s + c.spend, 0),
      leads: items.reduce((s, c) => s + c.leads, 0),
      conversions: items.reduce((s, c) => s + c.conversions, 0),
    };
  });
}

export function getCampaignSpendSeries(store: Store) {
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const { adCampaigns } = store;
  const totalSpend = adCampaigns.reduce((s, c) => s + c.spend, 0) || 1;
  return months.map((month, idx) => {
    const weight = 0.7 + Math.sin(idx / 2) * 0.25 + idx * 0.05;
    return {
      month,
      facebook: Math.round((totalSpend / months.length) * weight * 0.55),
      google: Math.round((totalSpend / months.length) * weight * 0.45),
    };
  });
}

export function rankCampaignsByRoas(store: Store) {
  const { adCampaigns } = store;
  return [...adCampaigns].sort((a, b) => b.roas - a.roas);
}

export function findUnderperformingCampaigns(store: Store) {
  const { adCampaigns } = store;
  return adCampaigns.filter((c) => c.status === "Active" && c.roas < 1.5).sort((a, b) => a.roas - b.roas);
}

export interface ClientStats {
  totalProjects: number;
  totalInvoiced: number;
  outstandingBalance: number;
}

/** Computed live from current projects/invoices so newly created or imported
 * records are always reflected, instead of trusting a stored snapshot field. */
export function getAllClientStats(store: Store): Map<string, ClientStats> {
  const { projects, invoices } = store;
  const stats = new Map<string, ClientStats>();
  const ensure = (clientId: string) => {
    let s = stats.get(clientId);
    if (!s) {
      s = { totalProjects: 0, totalInvoiced: 0, outstandingBalance: 0 };
      stats.set(clientId, s);
    }
    return s;
  };
  projects.forEach((p) => {
    ensure(p.clientId).totalProjects += 1;
  });
  invoices.forEach((iv) => {
    const s = ensure(iv.clientId);
    s.totalInvoiced += iv.amount;
    if (iv.status === "Overdue" || iv.status === "Pending") s.outstandingBalance += iv.amount;
  });
  return stats;
}

export function getClientStats(store: Store, clientId: string): ClientStats {
  return getAllClientStats(store).get(clientId) ?? { totalProjects: 0, totalInvoiced: 0, outstandingBalance: 0 };
}
