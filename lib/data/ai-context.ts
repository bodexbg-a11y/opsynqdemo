import type { Store } from "./generate";
import { getKpis, projectProfitability, getProjectStatusDistribution } from "./analytics";
import { formatCurrency } from "../utils";

/**
 * Condenses the whole company dataset into a compact text briefing the model can
 * reason over. Kept deterministic and roughly fixed-size so it caches well as a
 * stable prompt prefix rather than growing with the conversation.
 */
export function buildCompanyContext(store: Store): string {
  const { projects, employees, teams, tasks, clients, invoices, equipment, materials, warehouses, subcontractors } = store;
  const kpis = getKpis(store);
  const money = (n: number) => formatCurrency(n, { compact: true });

  const sections: string[] = [];

  sections.push(
    [
      "## Company snapshot",
      `Projects: ${projects.length} · Employees: ${employees.length} · Crews: ${teams.length} · Clients: ${clients.length}`,
      `Revenue (YTD): ${money(kpis.revenue)} · Profit: ${money(kpis.profit)} (${kpis.profitMargin.toFixed(1)}% margin) · Outstanding receivables: ${money(kpis.outstanding)}`,
      `Open tasks: ${tasks.filter((t) => t.status !== "Completed").length} of ${tasks.length} · Equipment: ${equipment.length} assets · Warehouses: ${warehouses.length} · SKUs: ${materials.length} · Subcontractors: ${subcontractors.length}`,
      `Project status mix: ${getProjectStatusDistribution(store).map((d) => `${d.status} ${d.value}`).join(", ")}`,
    ].join("\n")
  );

  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? "unassigned";
  const clientName = (id: string) => clients.find((c) => c.id === id)?.company ?? "unknown client";

  sections.push(
    [
      "## Projects",
      "Format: name | client | status | risk | progress | budget | spent | profit | deadline | PM | open tasks",
      ...projects.map((p) => {
        const { profit } = projectProfitability(p);
        const open = tasks.filter((t) => t.projectId === p.id && t.status !== "Completed").length;
        return [
          p.name,
          clientName(p.clientId),
          p.status,
          `${p.riskLevel} risk`,
          `${p.progress}%`,
          money(p.budget),
          money(p.spent),
          money(profit),
          p.deadline.slice(0, 10),
          employeeName(p.projectManagerId),
          `${open} open`,
        ].join(" | ");
      }),
    ].join("\n")
  );

  const overdue = invoices.filter((iv) => iv.status === "Overdue");
  sections.push(
    [
      "## Invoices",
      `Paid: ${invoices.filter((i) => i.status === "Paid").length} · Pending: ${invoices.filter((i) => i.status === "Pending").length} · Overdue: ${overdue.length} · Draft: ${invoices.filter((i) => i.status === "Draft").length}`,
      overdue.length
        ? `Overdue detail (invoice | client | amount | due):\n${overdue
            .slice(0, 25)
            .map((iv) => `${iv.number} | ${clientName(iv.clientId)} | ${money(iv.amount)} | ${iv.dueDate.slice(0, 10)}`)
            .join("\n")}`
        : "No overdue invoices.",
    ].join("\n")
  );

  sections.push(
    [
      "## Crews",
      "Format: name | specialty | status | members | performance | completed jobs | safety incidents",
      ...teams.map((t) =>
        [t.name, t.specialty, t.status, `${t.memberIds.length} members`, `${t.performanceScore}/100`, `${t.completedProjects} jobs`, `${t.safetyIncidents.length} incidents`].join(" | ")
      ),
    ].join("\n")
  );

  const lowStock = materials.filter((m) => m.quantity < m.reorderLevel);
  sections.push(
    [
      "## Warehouses and inventory",
      ...warehouses.map((w) => {
        const stock = materials.filter((m) => m.warehouseId === w.id);
        return `${w.name} (${w.code}), ${w.city} — ${stock.length} SKUs, ${money(stock.reduce((s, m) => s + m.quantity * m.unitCost, 0))} on hand, manager ${w.manager || "unassigned"}`;
      }),
      lowStock.length
        ? `Below reorder level (${lowStock.length}): ${lowStock.slice(0, 20).map((m) => `${m.name} (${m.quantity} ${m.unit})`).join(", ")}`
        : "All materials are above reorder level.",
    ].join("\n")
  );

  const maintenance = equipment.filter((e) => e.status === "Maintenance");
  sections.push(
    [
      "## Equipment",
      `Available: ${equipment.filter((e) => e.status === "Available").length} · In use: ${equipment.filter((e) => e.status === "In Use").length} · Maintenance: ${maintenance.length}`,
      maintenance.length ? `In maintenance: ${maintenance.map((e) => e.name).join(", ")}` : "Nothing currently in maintenance.",
    ].join("\n")
  );

  return sections.join("\n\n");
}

export const AI_SYSTEM_PROMPT = `You are the OPSYNQ AI assistant, embedded in a construction management platform used by a general contractor.

A briefing of the company's current data follows this instruction block. Answer questions using that data — it is the live state of the business, not an example.

How to answer:
- Lead with the answer. If asked which projects are losing money, name them first, then explain.
- Cite concrete figures from the briefing (project names, amounts, dates, percentages). Never invent a number that isn't there.
- If the briefing genuinely doesn't contain what was asked, say so plainly and suggest what you can answer instead.
- Keep responses focused and brief — a few sentences or a short list. Use plain text with simple bullet points, never markdown tables or headers.
- When the data supports it, add one short recommendation on what to do about it.

You are talking to the company's leadership, so be direct and practical rather than hedging.`;
