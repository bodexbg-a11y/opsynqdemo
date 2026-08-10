import type { Store } from "./generate";
import {
  findLosingProjects,
  findAtRiskProjects,
  rankTeamsByPerformance,
  findOverdueInvoices,
  getTodaysTasks,
  getCampaignKpis,
  rankCampaignsByRoas,
  findUnderperformingCampaigns,
} from "./analytics";
import { formatCurrency, formatDate } from "../utils";

export function answerLosingMoney(store: Store) {
  const losers = findLosingProjects(store);
  if (!losers.length) return "Great news — every active project is currently tracking at or under budget. No projects are losing money right now.";
  const top = losers.slice(0, 5);
  const lines = top.map(({ p, profit, margin }) => `• ${p.name} — ${formatCurrency(profit, { compact: true })} (${margin.toFixed(1)}% margin), ${p.status.toLowerCase()}`);
  return `${losers.length} project${losers.length > 1 ? "s are" : " is"} currently over budget. The worst performers:\n\n${lines.join("\n")}\n\nRecommend reviewing scope creep and change orders on ${top[0].p.name} first — it has the largest variance.`;
}

export function answerMissingDeadlines(store: Store) {
  const atRisk = findAtRiskProjects(store);
  if (!atRisk.length) return "No projects are currently flagged as at risk of missing their deadline. Schedule health looks strong company-wide.";
  const lines = atRisk
    .slice(0, 6)
    .map((p) => `• ${p.name} — ${p.progress}% complete, due ${formatDate(p.deadline)}, ${p.riskLevel.toLowerCase()} risk`);
  return `${atRisk.length} project${atRisk.length > 1 ? "s" : ""} are at risk of missing their deadline:\n\n${lines.join("\n")}\n\nConsider reallocating additional crews to the highest-risk jobs to recover schedule.`;
}

export function answerTeamPerformance(store: Store) {
  const ranked = rankTeamsByPerformance(store);
  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-3).reverse();
  const topLines = top.map((t, i) => `${i + 1}. ${t.name} — ${t.performanceScore}/100 (${t.completedProjects} jobs completed)`);
  const bottomLines = bottom.map((t) => `• ${t.name} — ${t.performanceScore}/100`);
  return `Top performing crews:\n\n${topLines.join("\n")}\n\nCrews that may need support:\n\n${bottomLines.join("\n")}`;
}

export function answerOverdueInvoices(store: Store) {
  const overdue = findOverdueInvoices(store);
  const { clients } = store;
  if (!overdue.length) return "There are no overdue invoices right now. Collections are current across all clients.";
  const total = overdue.reduce((s, iv) => s + iv.amount, 0);
  const lines = overdue.slice(0, 6).map((iv) => {
    const client = clients.find((c) => c.id === iv.clientId);
    return `• ${iv.number} — ${formatCurrency(iv.amount, { compact: true })} from ${client?.company ?? "Unknown"}, due ${formatDate(iv.dueDate)}`;
  });
  return `${overdue.length} invoices totaling ${formatCurrency(total, { compact: true })} are overdue:\n\n${lines.join("\n")}\n\nPrioritize collections on the largest balances to protect cash flow.`;
}

export function answerTodayFocus(store: Store) {
  const { projects, teams } = store;
  const tasks = getTodaysTasks(store, 10);
  const behind = projects.filter((p) => p.status === "Behind Schedule");
  const overdue = findOverdueInvoices(store);
  const lines = [
    `You have ${tasks.length} task${tasks.length !== 1 ? "s" : ""} due today across active job sites.`,
    behind.length ? `${behind.length} project${behind.length > 1 ? "s are" : " is"} behind schedule and need attention: ${behind.map((p) => p.name).join(", ")}.` : "No projects are behind schedule today.",
    overdue.length ? `${overdue.length} invoices are overdue — consider following up on collections.` : "No overdue invoices to chase today.",
    `${teams.filter((t) => t.status === "On Site").length} crews are actively on site.`,
  ];
  return lines.join("\n\n");
}

export function answerCompanySummary(store: Store) {
  const { projects, invoices, employees, teams } = store;
  const active = projects.filter((p) => p.status === "In Progress" || p.status === "Behind Schedule").length;
  const completed = projects.filter((p) => p.status === "Completed").length;
  const revenue = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const losers = findLosingProjects(store);
  const overdue = findOverdueInvoices(store);
  return [
    `OPSYNQ is currently managing ${projects.length} projects (${active} active, ${completed} completed) with ${employees.length} employees across ${teams.length} crews.`,
    `Year-to-date collected revenue stands at ${formatCurrency(revenue, { compact: true })}.`,
    `${losers.length} project${losers.length !== 1 ? "s" : ""} are currently over budget, and ${overdue.length} invoice${overdue.length !== 1 ? "s are" : " is"} overdue.`,
    `Overall, the business is ${losers.length > 6 ? "facing margin pressure on several jobs and should prioritize cost control" : "healthy, with most projects tracking to plan"}.`,
  ].join(" ");
}

export function answerCampaignPerformance(store: Store) {
  const kpis = getCampaignKpis(store);
  const ranked = rankCampaignsByRoas(store);
  const top = ranked.slice(0, 4);
  const topLines = top.map(
    (c) => `• ${c.name} (${c.platform}) — ${c.roas.toFixed(1)}x ROAS, ${formatCurrency(c.spend, { compact: true })} spent, ${c.conversions} conversions`
  );
  return [
    `Across ${kpis.totalCampaigns} campaigns (${kpis.activeCampaigns} active) on Facebook Ads + Google Ads, you've spent ${formatCurrency(kpis.totalSpend, { compact: true })} generating ${kpis.totalLeads} leads and ${kpis.totalConversions} conversions.`,
    `Blended ROAS is ${kpis.blendedRoas.toFixed(2)}x.`,
    `Best performing campaigns:\n${topLines.join("\n")}`,
  ].join("\n\n");
}

export function answerUnderperformingCampaigns(store: Store) {
  const underperformers = findUnderperformingCampaigns(store);
  if (!underperformers.length) return "All active ad campaigns are currently returning a healthy ROAS (1.5x or better) — no underperforming campaigns to flag right now.";
  const lines = underperformers
    .slice(0, 6)
    .map((c) => `• ${c.name} (${c.platform}) — ${c.roas.toFixed(1)}x ROAS, ${formatCurrency(c.spend, { compact: true })} spent, ${c.costPerConversion > 0 ? `${formatCurrency(c.costPerConversion)} per conversion` : "no conversions yet"}`);
  return `${underperformers.length} active campaign${underperformers.length > 1 ? "s are" : " is"} underperforming (ROAS below 1.5x):\n\n${lines.join("\n")}\n\nRecommend pausing or reworking targeting/creative on ${underperformers[0].name} first — it has the lowest return.`;
}

export interface PresetQA {
  question: string;
  answer: string;
  keywords: string[];
}

export function getPresetAnswers(store: Store): PresetQA[] {
  return [
    { question: "Which projects are losing money?", answer: answerLosingMoney(store), keywords: ["losing", "money", "loss", "over budget", "unprofitable"] },
    { question: "Which projects will miss deadlines?", answer: answerMissingDeadlines(store), keywords: ["deadline", "miss", "late", "behind", "schedule", "risk"] },
    { question: "Which teams perform the best?", answer: answerTeamPerformance(store), keywords: ["team", "perform", "crew", "best", "productivity"] },
    { question: "Which invoices are overdue?", answer: answerOverdueInvoices(store), keywords: ["invoice", "overdue", "unpaid", "collections", "payment"] },
    { question: "What should I focus on today?", answer: answerTodayFocus(store), keywords: ["today", "focus", "priorit"] },
    { question: "Summarize today's company status.", answer: answerCompanySummary(store), keywords: ["summary", "summarize", "status", "overview", "company"] },
    { question: "How are my ad campaigns performing?", answer: answerCampaignPerformance(store), keywords: ["campaign", "ad", "ads", "facebook", "google", "roas", "marketing"] },
    { question: "Which ad campaigns are underperforming?", answer: answerUnderperformingCampaigns(store), keywords: ["underperform", "bad campaign", "low roas", "pause"] },
  ];
}
