import { prisma } from "../db";
import type { Store } from "./generate";
import type {
  Project,
  Employee,
  Team,
  Task,
  Client,
  Invoice,
  Contract,
  Subcontractor,
  Equipment,
  Supplier,
  Warehouse,
  Material,
  PurchaseOrder,
  DocumentItem,
  AppNotification,
  AdCampaign,
} from "./types";

function json<T>(value: unknown): T {
  return value as T;
}

/**
 * Reads the full demo dataset from Postgres. Dates come back from Prisma as `Date` objects;
 * everything downstream (pages, analytics, actions) expects ISO strings as declared in
 * `./types`, so that conversion happens once here rather than rippling through the app.
 */
export async function getStore(): Promise<Store> {
  const [
    projectRows,
    employeeRows,
    teamRows,
    taskRows,
    clientRows,
    invoiceRows,
    contractRows,
    subcontractorRows,
    equipmentRows,
    warehouseRows,
    materialRows,
    supplierRows,
    purchaseOrderRows,
    documentRows,
    notificationRows,
    adCampaignRows,
  ] = await Promise.all([
    prisma.project.findMany({ orderBy: { id: "asc" } }),
    prisma.employee.findMany({ orderBy: { id: "asc" } }),
    prisma.team.findMany({ orderBy: { id: "asc" } }),
    prisma.task.findMany({ orderBy: { id: "asc" } }),
    prisma.client.findMany({ orderBy: { id: "asc" } }),
    prisma.invoice.findMany({ orderBy: { id: "asc" } }),
    prisma.contract.findMany({ orderBy: { id: "asc" } }),
    prisma.subcontractor.findMany({ orderBy: { id: "asc" } }),
    prisma.equipment.findMany({ orderBy: { id: "asc" } }),
    prisma.warehouse.findMany({ orderBy: { id: "asc" } }),
    prisma.material.findMany({ orderBy: { id: "asc" } }),
    prisma.supplier.findMany({ orderBy: { id: "asc" } }),
    prisma.purchaseOrder.findMany({ orderBy: { id: "asc" } }),
    prisma.documentItem.findMany({ orderBy: { id: "asc" } }),
    prisma.appNotification.findMany({ orderBy: { timestamp: "desc" } }),
    prisma.adCampaign.findMany({ orderBy: { id: "asc" } }),
  ]);

  const projects: Project[] = projectRows.map((p) => ({
    ...p,
    startDate: p.startDate.toISOString(),
    deadline: p.deadline.toISOString(),
    category: json(p.category),
    status: json(p.status),
    riskLevel: json(p.riskLevel),
    milestones: json(p.milestones),
    comments: json(p.comments),
    activity: json(p.activity),
  }));

  const employees: Employee[] = employeeRows.map((e) => ({
    ...e,
    hireDate: e.hireDate.toISOString(),
    department: json(e.department),
    permission: json(e.permission),
    employmentType: json(e.employmentType),
    status: json(e.status),
    payrollStatus: json(e.payrollStatus),
    teamId: e.teamId ?? undefined,
  }));

  const teams: Team[] = teamRows.map((t) => ({
    ...t,
    specialty: json(t.specialty),
    status: json(t.status),
    safetyIncidents: json(t.safetyIncidents),
  }));

  const tasks: Task[] = taskRows.map((t) => ({
    ...t,
    dueDate: t.dueDate.toISOString(),
    createdDate: t.createdDate.toISOString(),
    status: json(t.status),
    priority: json(t.priority),
  }));

  const clients: Client[] = clientRows.map((c) => ({
    ...c,
    since: c.since.toISOString(),
    status: json(c.status),
    contacts: json(c.contacts),
    communications: json(c.communications),
  }));

  const invoices: Invoice[] = invoiceRows.map((iv) => ({
    ...iv,
    issueDate: iv.issueDate.toISOString(),
    dueDate: iv.dueDate.toISOString(),
    paidDate: iv.paidDate ? iv.paidDate.toISOString() : null,
    status: json(iv.status),
  }));

  const contracts: Contract[] = contractRows.map((c) => ({
    ...c,
    signedDate: c.signedDate.toISOString(),
    type: json(c.type),
    status: json(c.status),
  }));

  const subcontractors: Subcontractor[] = subcontractorRows.map((s) => ({
    ...s,
    trade: json(s.trade),
    status: json(s.status),
  }));

  const equipment: Equipment[] = equipmentRows.map((e) => ({
    ...e,
    lastMaintenance: e.lastMaintenance.toISOString(),
    nextMaintenance: e.nextMaintenance.toISOString(),
    purchaseDate: e.purchaseDate.toISOString(),
    type: json(e.type),
    status: json(e.status),
  }));

  const warehouses: Warehouse[] = warehouseRows.map((w) => ({ ...w }));
  const materials: Material[] = materialRows.map((m) => ({ ...m }));

  const suppliers: Supplier[] = supplierRows.map((s) => ({ ...s }));

  const purchaseOrders: PurchaseOrder[] = purchaseOrderRows.map((po) => ({
    ...po,
    orderDate: po.orderDate.toISOString(),
    expectedDate: po.expectedDate.toISOString(),
    status: json(po.status),
  }));

  const documents: DocumentItem[] = documentRows.map((d) => ({
    ...d,
    projectId: d.projectId ?? null,
    uploadDate: d.uploadDate.toISOString(),
    category: json(d.category),
  }));

  const notifications: AppNotification[] = notificationRows.map((n) => ({
    ...n,
    timestamp: n.timestamp.toISOString(),
    type: json(n.type),
    severity: json(n.severity),
    link: n.link ?? undefined,
  }));

  const adCampaigns: AdCampaign[] = adCampaignRows.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate ? c.endDate.toISOString() : null,
    platform: json(c.platform),
    objective: json(c.objective),
    status: json(c.status),
    projectId: c.projectId ?? null,
  }));

  return {
    projects,
    employees,
    teams,
    tasks,
    clients,
    invoices,
    contracts,
    subcontractors,
    equipment,
    warehouses,
    materials,
    suppliers,
    purchaseOrders,
    documents,
    notifications,
    adCampaigns,
  };
}
