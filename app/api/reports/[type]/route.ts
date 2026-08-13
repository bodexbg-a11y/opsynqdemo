import ExcelJS from "exceljs";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";
import {
  getKpis,
  getProjectStatusDistribution,
  getTeamProductivity,
  getProjectFinancials,
  projectProfitability,
} from "@/lib/data/analytics";
import type { Store } from "@/lib/data/generate";

const MONEY = '"$"#,##0';
const PERCENT = "0.0%";

/** Adds a titled sheet with a bold header row and auto-styled columns. */
function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Partial<ExcelJS.Column>[],
  rows: Record<string, unknown>[]
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
  rows.forEach((r) => sheet.addRow(r));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return sheet;
}

/** Key/value cover sheet that opens every report. */
function addSummarySheet(workbook: ExcelJS.Workbook, title: string, entries: [string, string | number][]) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Metric", key: "metric", width: 34 },
    { header: "Value", key: "value", width: 26 },
  ];
  sheet.getRow(1).font = { bold: true, size: 12 };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
  sheet.addRow({ metric: "Report", value: title });
  sheet.addRow({ metric: "Generated", value: new Date().toISOString().slice(0, 16).replace("T", " ") });
  sheet.addRow({});
  entries.forEach(([metric, value]) => sheet.addRow({ metric, value }));
  return sheet;
}

function buildPortfolioReport(workbook: ExcelJS.Workbook, store: Store) {
  const { projects, clients, employees, tasks } = store;
  const dist = getProjectStatusDistribution(store);

  addSummarySheet(workbook, "Project Portfolio Report", [
    ["Total projects", projects.length],
    ["Total budget", projects.reduce((s, p) => s + p.budget, 0)],
    ["Total spent", projects.reduce((s, p) => s + p.spent, 0)],
    ["Average progress", `${Math.round(projects.reduce((s, p) => s + p.progress, 0) / (projects.length || 1))}%`],
    ["High-risk projects", projects.filter((p) => p.riskLevel === "High").length],
    ...dist.map((d) => [`Status — ${d.status}`, d.value] as [string, number]),
  ]);

  addSheet(
    workbook,
    "Projects",
    [
      { header: "ID", key: "id", width: 12 },
      { header: "Project", key: "name", width: 34 },
      { header: "Client", key: "client", width: 26 },
      { header: "Category", key: "category", width: 15 },
      { header: "Status", key: "status", width: 16 },
      { header: "Risk", key: "risk", width: 10 },
      { header: "Progress %", key: "progress", width: 11 },
      { header: "Budget", key: "budget", width: 15, style: { numFmt: MONEY } },
      { header: "Spent", key: "spent", width: 15, style: { numFmt: MONEY } },
      { header: "Profit", key: "profit", width: 15, style: { numFmt: MONEY } },
      { header: "Tasks", key: "tasks", width: 9 },
      { header: "Open Tasks", key: "openTasks", width: 11 },
      { header: "PM", key: "pm", width: 22 },
      { header: "City", key: "city", width: 16 },
      { header: "Start", key: "start", width: 13 },
      { header: "Deadline", key: "deadline", width: 13 },
    ],
    projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      return {
        id: p.id,
        name: p.name,
        client: clients.find((c) => c.id === p.clientId)?.company ?? "",
        category: p.category,
        status: p.status,
        risk: p.riskLevel,
        progress: p.progress,
        budget: p.budget,
        spent: p.spent,
        profit: projectProfitability(p).profit,
        tasks: pTasks.length,
        openTasks: pTasks.filter((t) => t.status !== "Completed").length,
        pm: employees.find((e) => e.id === p.projectManagerId)?.name ?? "",
        city: `${p.city}, ${p.state}`,
        start: p.startDate.slice(0, 10),
        deadline: p.deadline.slice(0, 10),
      };
    })
  );

  addSheet(
    workbook,
    "Status Breakdown",
    [
      { header: "Status", key: "status", width: 22 },
      { header: "Projects", key: "value", width: 12 },
    ],
    dist.map((d) => ({ status: d.status, value: d.value }))
  );
}

function buildFinancialReport(workbook: ExcelJS.Workbook, store: Store) {
  const { projects, invoices, clients, contracts } = store;
  const kpis = getKpis(store);

  addSummarySheet(workbook, "Financial Summary Report", [
    ["Revenue (YTD)", kpis.revenue],
    ["Profit", kpis.profit],
    ["Profit margin", `${kpis.profitMargin.toFixed(1)}%`],
    ["Outstanding receivables", kpis.outstanding],
    ["Total contract value", contracts.reduce((s, c) => s + c.value, 0)],
    ["Invoices issued", invoices.length],
    ["Invoices overdue", invoices.filter((i) => i.status === "Overdue").length],
  ]);

  addSheet(
    workbook,
    "Project P&L",
    [
      { header: "Project", key: "name", width: 34 },
      { header: "Client", key: "client", width: 26 },
      { header: "Contract Value", key: "contractValue", width: 16, style: { numFmt: MONEY } },
      { header: "Budget", key: "budget", width: 15, style: { numFmt: MONEY } },
      { header: "Spent", key: "spent", width: 15, style: { numFmt: MONEY } },
      { header: "Collected", key: "collected", width: 15, style: { numFmt: MONEY } },
      { header: "Outstanding", key: "outstanding", width: 15, style: { numFmt: MONEY } },
      { header: "Overdue", key: "overdue", width: 15, style: { numFmt: MONEY } },
      { header: "Profit", key: "profit", width: 15, style: { numFmt: MONEY } },
      { header: "Margin", key: "margin", width: 11, style: { numFmt: PERCENT } },
    ],
    projects.map((p) => {
      const f = getProjectFinancials(store, p.id)!;
      return {
        name: p.name,
        client: clients.find((c) => c.id === p.clientId)?.company ?? "",
        contractValue: f.contractValue,
        budget: f.budget,
        spent: f.spent,
        collected: f.collected,
        outstanding: f.outstanding,
        overdue: f.overdue,
        profit: f.profit,
        margin: f.margin / 100,
      };
    })
  );

  addSheet(
    workbook,
    "Invoices",
    [
      { header: "Invoice", key: "number", width: 16 },
      { header: "Project", key: "project", width: 32 },
      { header: "Client", key: "client", width: 26 },
      { header: "Amount", key: "amount", width: 15, style: { numFmt: MONEY } },
      { header: "Status", key: "status", width: 12 },
      { header: "Issued", key: "issueDate", width: 13 },
      { header: "Due", key: "dueDate", width: 13 },
      { header: "Paid", key: "paidDate", width: 13 },
    ],
    invoices.map((iv) => ({
      number: iv.number,
      project: projects.find((p) => p.id === iv.projectId)?.name ?? "",
      client: clients.find((c) => c.id === iv.clientId)?.company ?? "",
      amount: iv.amount,
      status: iv.status,
      issueDate: iv.issueDate.slice(0, 10),
      dueDate: iv.dueDate.slice(0, 10),
      paidDate: iv.paidDate ? iv.paidDate.slice(0, 10) : "",
    }))
  );
}

function buildWorkforceReport(workbook: ExcelJS.Workbook, store: Store) {
  const { employees, teams, projects, tasks } = store;
  const productivity = getTeamProductivity(store);

  addSummarySheet(workbook, "Workforce Performance Report", [
    ["Total employees", employees.length],
    ["Active employees", employees.filter((e) => e.status === "Active").length],
    ["On leave / vacation", employees.filter((e) => e.status !== "Active").length],
    ["Crews", teams.length],
    ["Average crew performance", Math.round(teams.reduce((s, t) => s + t.performanceScore, 0) / (teams.length || 1))],
    ["Total safety incidents", teams.reduce((s, t) => s + t.safetyIncidents.length, 0)],
  ]);

  addSheet(
    workbook,
    "Employees",
    [
      { header: "ID", key: "id", width: 12 },
      { header: "Name", key: "name", width: 26 },
      { header: "Role", key: "role", width: 24 },
      { header: "Department", key: "department", width: 18 },
      { header: "Status", key: "status", width: 12 },
      { header: "Employment", key: "employmentType", width: 14 },
      { header: "Team", key: "team", width: 26 },
      { header: "Weekly Hours", key: "weeklyHours", width: 13 },
      { header: "Performance", key: "performanceScore", width: 12 },
      { header: "Vacation Used", key: "vacation", width: 14 },
      { header: "Hire Date", key: "hireDate", width: 13 },
    ],
    employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      department: e.department,
      status: e.status,
      employmentType: e.employmentType,
      team: e.teamId ? teams.find((t) => t.id === e.teamId)?.name ?? "" : "",
      weeklyHours: e.weeklyHours,
      performanceScore: e.performanceScore,
      vacation: `${e.vacationUsed}/${e.vacationTotal}`,
      hireDate: e.hireDate.slice(0, 10),
    }))
  );

  addSheet(
    workbook,
    "Crews",
    [
      { header: "Crew", key: "name", width: 30 },
      { header: "Specialty", key: "specialty", width: 16 },
      { header: "Status", key: "status", width: 13 },
      { header: "Members", key: "members", width: 10 },
      { header: "Assigned Project", key: "project", width: 32 },
      { header: "Completed Jobs", key: "completed", width: 15 },
      { header: "Avg Hours/wk", key: "hours", width: 13 },
      { header: "Performance", key: "performance", width: 12 },
      { header: "Safety Incidents", key: "incidents", width: 16 },
    ],
    teams.map((t) => ({
      name: t.name,
      specialty: t.specialty,
      status: t.status,
      members: t.memberIds.length,
      project: t.currentProjectId ? projects.find((p) => p.id === t.currentProjectId)?.name ?? "" : "",
      completed: t.completedProjects,
      hours: t.avgWeeklyHours,
      performance: t.performanceScore,
      incidents: t.safetyIncidents.length,
    }))
  );

  addSheet(
    workbook,
    "Crew Productivity",
    [
      { header: "Crew", key: "name", width: 30 },
      { header: "Score", key: "score", width: 12 },
    ],
    productivity.map((p) => ({ name: p.name, score: p.score }))
  );

  addSheet(
    workbook,
    "Task Load",
    [
      { header: "Project", key: "project", width: 34 },
      { header: "Total Tasks", key: "total", width: 12 },
      { header: "Completed", key: "completed", width: 12 },
      { header: "In Progress", key: "inProgress", width: 12 },
      { header: "Blocked", key: "blocked", width: 10 },
      { header: "To Do", key: "todo", width: 10 },
    ],
    projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      return {
        project: p.name,
        total: pTasks.length,
        completed: pTasks.filter((t) => t.status === "Completed").length,
        inProgress: pTasks.filter((t) => t.status === "In Progress").length,
        blocked: pTasks.filter((t) => t.status === "Blocked").length,
        todo: pTasks.filter((t) => t.status === "To Do").length,
      };
    })
  );
}

function buildEquipmentReport(workbook: ExcelJS.Workbook, store: Store) {
  const { equipment, projects, materials, warehouses, suppliers } = store;

  addSummarySheet(workbook, "Equipment & Inventory Report", [
    ["Total assets", equipment.length],
    ["Available", equipment.filter((e) => e.status === "Available").length],
    ["In use", equipment.filter((e) => e.status === "In Use").length],
    ["In maintenance", equipment.filter((e) => e.status === "Maintenance").length],
    ["Total logged hours", equipment.reduce((s, e) => s + e.hoursUsed, 0)],
    ["Warehouses", warehouses.length],
    ["Material SKUs", materials.length],
    ["Inventory value", materials.reduce((s, m) => s + m.quantity * m.unitCost, 0)],
    ["SKUs below reorder level", materials.filter((m) => m.quantity < m.reorderLevel).length],
  ]);

  addSheet(
    workbook,
    "Equipment",
    [
      { header: "ID", key: "id", width: 12 },
      { header: "Asset", key: "name", width: 30 },
      { header: "Type", key: "type", width: 16 },
      { header: "Status", key: "status", width: 13 },
      { header: "Assigned Project", key: "project", width: 32 },
      { header: "Location", key: "location", width: 26 },
      { header: "Hours Used", key: "hoursUsed", width: 12 },
      { header: "Last Maintenance", key: "last", width: 16 },
      { header: "Next Maintenance", key: "next", width: 16 },
      { header: "QR Tag", key: "qrCode", width: 16 },
    ],
    equipment.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      status: e.status,
      project: e.currentProjectId ? projects.find((p) => p.id === e.currentProjectId)?.name ?? "" : "",
      location: e.location,
      hoursUsed: e.hoursUsed,
      last: e.lastMaintenance.slice(0, 10),
      next: e.nextMaintenance.slice(0, 10),
      qrCode: e.qrCode,
    }))
  );

  addSheet(
    workbook,
    "Warehouses",
    [
      { header: "Warehouse", key: "name", width: 30 },
      { header: "Code", key: "code", width: 10 },
      { header: "City", key: "city", width: 20 },
      { header: "Manager", key: "manager", width: 24 },
      { header: "Capacity", key: "capacity", width: 12 },
      { header: "Units Stored", key: "units", width: 13 },
      { header: "SKUs", key: "skus", width: 9 },
      { header: "Stock Value", key: "value", width: 16, style: { numFmt: MONEY } },
      { header: "Low Stock SKUs", key: "low", width: 15 },
    ],
    warehouses.map((w) => {
      const stock = materials.filter((m) => m.warehouseId === w.id);
      return {
        name: w.name,
        code: w.code,
        city: `${w.city}, ${w.state}`,
        manager: w.manager,
        capacity: w.capacity,
        units: stock.reduce((s, m) => s + m.quantity, 0),
        skus: stock.length,
        value: stock.reduce((s, m) => s + m.quantity * m.unitCost, 0),
        low: stock.filter((m) => m.quantity < m.reorderLevel).length,
      };
    })
  );

  addSheet(
    workbook,
    "Inventory",
    [
      { header: "SKU", key: "sku", width: 14 },
      { header: "Material", key: "name", width: 30 },
      { header: "Category", key: "category", width: 16 },
      { header: "Warehouse", key: "warehouse", width: 26 },
      { header: "Bin", key: "bin", width: 18 },
      { header: "Quantity", key: "quantity", width: 11 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Reorder Level", key: "reorderLevel", width: 14 },
      { header: "Unit Cost", key: "unitCost", width: 13, style: { numFmt: MONEY } },
      { header: "Stock Value", key: "value", width: 15, style: { numFmt: MONEY } },
      { header: "Supplier", key: "supplier", width: 28 },
    ],
    materials.map((m) => ({
      sku: m.sku,
      name: m.name,
      category: m.category,
      warehouse: m.warehouseId ? warehouses.find((w) => w.id === m.warehouseId)?.name ?? "" : "Unassigned",
      bin: m.warehouseLocation,
      quantity: m.quantity,
      unit: m.unit,
      reorderLevel: m.reorderLevel,
      unitCost: m.unitCost,
      value: m.quantity * m.unitCost,
      supplier: suppliers.find((s) => s.id === m.supplierId)?.name ?? "",
    }))
  );
}

const BUILDERS: Record<string, { build: (wb: ExcelJS.Workbook, store: Store) => void; filename: string }> = {
  portfolio: { build: buildPortfolioReport, filename: "project-portfolio" },
  financial: { build: buildFinancialReport, filename: "financial-summary" },
  workforce: { build: buildWorkforceReport, filename: "workforce-performance" },
  equipment: { build: buildEquipmentReport, filename: "equipment-inventory" },
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  await requireAdmin();
  const { type } = await params;

  const builder = BUILDERS[type];
  if (!builder) {
    return new Response(`Unknown report type "${type}".`, { status: 404 });
  }

  const store = await getStore();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OPSYNQ Construction OS";
  workbook.created = new Date();
  builder.build(workbook, store);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="opsynq-${builder.filename}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
