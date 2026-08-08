"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import { getStore } from "./data/store";
import { nextEntityId } from "./data/ids";
import { normalizeHeader, pick, cellToString, parseNumber, parseDateOrDefault, matchEnum } from "./data/import-helpers";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, RISK_LEVELS, TEAM_SPECIALTIES, TEAM_STATUSES, CLIENT_STATUSES } from "./data/constants";
import type { Project, Team, Client, Milestone, ActivityItem } from "./data/types";
import type { Store } from "./data/generate";

function resolveOrCreateClient(store: Store, name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return store.clients[0]?.id ?? "";
  const existing = store.clients.find((c) => c.company.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing.id;

  const newClient: Client = {
    id: nextEntityId("CT", store.clients),
    company: trimmed,
    industry: "General Contracting",
    contacts: [],
    address: "",
    city: "",
    state: "",
    status: "Lead",
    since: new Date().toISOString(),
    totalProjects: 0,
    totalInvoiced: 0,
    outstandingBalance: 0,
    communications: [],
  };
  store.clients.push(newClient);
  return newClient.id;
}

function buildDefaultMilestones(projectId: string, startDate: Date, deadline: Date): Milestone[] {
  const names = [
    "Site Preparation",
    "Foundation",
    "Structural Framing",
    "MEP Rough-In",
    "Exterior Envelope",
    "Interior Finishing",
    "Final Inspection",
    "Handover",
  ];
  const span = Math.max(deadline.getTime() - startDate.getTime(), 1);
  return names.map((label, i) => ({
    id: `${projectId}-MS${i}`,
    label,
    date: new Date(startDate.getTime() + (span / names.length) * (i + 1)).toISOString(),
    done: false,
  }));
}

export async function createProjectAction(formData: FormData) {
  const store = getStore();

  const name = String(formData.get("name") || "").trim() || "Untitled Project";
  const category = matchEnum(String(formData.get("category") || ""), PROJECT_CATEGORIES, "Residential");
  const status = matchEnum(String(formData.get("status") || ""), PROJECT_STATUSES, "Planning");
  const riskLevel = matchEnum(String(formData.get("riskLevel") || ""), RISK_LEVELS, "Medium");
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const budget = parseNumber(String(formData.get("budget") || ""), 0);
  const description = String(formData.get("description") || "").trim() || "Created manually via the New Project form.";

  const now = new Date();
  const startDate = parseDateOrDefault(String(formData.get("startDate") || ""), now);
  const deadline = parseDateOrDefault(
    String(formData.get("deadline") || ""),
    new Date(startDate.getTime() + 180 * 86400000)
  );

  const clientId = resolveOrCreateClient(store, String(formData.get("clientName") || ""));

  const requestedPmId = String(formData.get("projectManagerId") || "");
  const projectManagerId = store.employees.some((e) => e.id === requestedPmId) ? requestedPmId : store.employees[0]?.id ?? "";

  const teamIds = formData.getAll("teamIds").map(String).filter((id) => store.teams.some((t) => t.id === id));

  const id = nextEntityId("PRJ", store.projects);
  const activity: ActivityItem[] = [
    { id: `${id}-AC0`, actor: "You", action: "created this project", date: now.toISOString() },
  ];

  const project: Project = {
    id,
    name,
    category,
    clientId,
    address,
    city,
    state,
    status,
    riskLevel,
    budget,
    spent: 0,
    invoicedToDate: 0,
    startDate: startDate.toISOString(),
    deadline: deadline.toISOString(),
    progress: status === "Completed" ? 100 : status === "In Progress" ? 5 : 0,
    teamIds,
    projectManagerId,
    photos: [],
    filesCount: 0,
    milestones: buildDefaultMilestones(id, startDate, deadline),
    comments: [],
    activity,
    description,
  };

  store.projects.push(project);
  teamIds.forEach((tid) => {
    const team = store.teams.find((t) => t.id === tid);
    if (team && !team.currentProjectId) team.currentProjectId = project.id;
  });

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${id}`);
}

export async function createTeamAction(formData: FormData) {
  const store = getStore();

  const specialty = matchEnum(String(formData.get("specialty") || ""), TEAM_SPECIALTIES, "General Labor");
  const status = matchEnum(String(formData.get("status") || ""), TEAM_STATUSES, "Available");
  const callsign = String(formData.get("callsign") || "").trim();

  const requestedForemanId = String(formData.get("foremanId") || "");
  const foremanId = store.employees.some((e) => e.id === requestedForemanId) ? requestedForemanId : store.employees[0]?.id ?? "";
  const memberIds = formData
    .getAll("memberIds")
    .map(String)
    .filter((id) => id !== foremanId && store.employees.some((e) => e.id === id));

  const id = nextEntityId("TEAM", store.teams);
  const name = callsign ? `Crew ${callsign} — ${specialty}` : `Crew ${id.split("-")[1]} — ${specialty}`;

  const team: Team = {
    id,
    name,
    specialty,
    foremanId,
    memberIds,
    currentProjectId: null,
    completedProjects: 0,
    avgWeeklyHours: 40,
    performanceScore: 75,
    safetyIncidents: [],
    certifications: [],
    status,
  };

  store.teams.push(team);

  const foreman = store.employees.find((e) => e.id === foremanId);
  if (foreman) foreman.teamId = team.id;
  memberIds.forEach((mid) => {
    const emp = store.employees.find((e) => e.id === mid);
    if (emp) emp.teamId = team.id;
  });

  revalidatePath("/teams");
  redirect(`/teams/${id}`);
}

export async function updateClientStatusAction(formData: FormData) {
  const store = getStore();
  const clientId = String(formData.get("clientId") || "");
  const status = matchEnum(String(formData.get("status") || ""), CLIENT_STATUSES, "Lead");
  const client = store.clients.find((c) => c.id === clientId);
  if (client) client.status = status;
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

const CLIENT_ALIASES = {
  company: ["company", "companyname", "client", "clientname", "name", "organization"].map(normalizeHeader),
  industry: ["industry", "sector", "businesstype"].map(normalizeHeader),
  address: ["address", "street", "streetaddress"].map(normalizeHeader),
  city: ["city", "town"].map(normalizeHeader),
  state: ["state", "region", "province"].map(normalizeHeader),
  status: ["status", "clientstatus"].map(normalizeHeader),
  contactName: ["contactname", "contact", "primarycontact", "fullname"].map(normalizeHeader),
  contactEmail: ["contactemail", "email"].map(normalizeHeader),
  contactPhone: ["contactphone", "phone", "telephone", "mobile"].map(normalizeHeader),
};

const PROJECT_ALIASES = {
  name: ["projectname", "name", "project", "title"].map(normalizeHeader),
  client: ["client", "clientname", "company", "customername"].map(normalizeHeader),
  category: ["category", "type", "projecttype"].map(normalizeHeader),
  address: ["address", "street", "streetaddress"].map(normalizeHeader),
  city: ["city", "town"].map(normalizeHeader),
  state: ["state", "region", "province"].map(normalizeHeader),
  budget: ["budget", "contractvalue", "value", "amount"].map(normalizeHeader),
  startDate: ["startdate", "start", "projectstart"].map(normalizeHeader),
  deadline: ["deadline", "enddate", "duedate", "completiondate", "projectend"].map(normalizeHeader),
  status: ["status", "projectstatus"].map(normalizeHeader),
  riskLevel: ["risk", "risklevel"].map(normalizeHeader),
  description: ["description", "notes", "summary"].map(normalizeHeader),
};

async function loadWorksheetRows(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type defs declare a conflicting global `Buffer extends ArrayBuffer`
  // stub that clashes with Node's real Buffer type — cast through `any` at this single
  // call site rather than fighting the ambient declaration merge.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headerMap: new Map<string, string>(), rows: [] as Record<string, unknown>[] };

  const headers: string[] = [];
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const raw = cellToString(cell.value);
    if (raw) headers[colNumber] = raw;
  });

  const headerMap = new Map<string, string>();
  headers.forEach((h) => {
    if (h) headerMap.set(normalizeHeader(h), h);
  });

  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (key) obj[key] = cell.value;
    });
    if (Object.keys(obj).length) rows.push(obj);
  });

  return { headerMap, rows };
}

export async function importClientsAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/import?type=clients&error=nofile");
  }

  const store = getStore();
  const { headerMap, rows } = await loadWorksheetRows(file as File);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const company = pick(row, headerMap, CLIENT_ALIASES.company);
    if (!company) {
      skipped++;
      continue;
    }
    const contactName = pick(row, headerMap, CLIENT_ALIASES.contactName);
    const contactEmail = pick(row, headerMap, CLIENT_ALIASES.contactEmail);
    const contactPhone = pick(row, headerMap, CLIENT_ALIASES.contactPhone);

    const id = nextEntityId("CT", store.clients);
    const client: Client = {
      id,
      company,
      industry: pick(row, headerMap, CLIENT_ALIASES.industry) || "General Contracting",
      contacts:
        contactName || contactEmail || contactPhone
          ? [
              {
                id: `${id}-C0`,
                name: contactName || "Primary Contact",
                title: "Contact",
                email: contactEmail,
                phone: contactPhone,
              },
            ]
          : [],
      address: pick(row, headerMap, CLIENT_ALIASES.address),
      city: pick(row, headerMap, CLIENT_ALIASES.city),
      state: pick(row, headerMap, CLIENT_ALIASES.state),
      status: matchEnum(pick(row, headerMap, CLIENT_ALIASES.status), CLIENT_STATUSES, "Lead"),
      since: new Date().toISOString(),
      totalProjects: 0,
      totalInvoiced: 0,
      outstandingBalance: 0,
      communications: [],
    };
    store.clients.push(client);
    imported++;
  }

  revalidatePath("/clients");
  redirect(`/import?type=clients&imported=${imported}&skipped=${skipped}`);
}

export async function importProjectsAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/import?type=projects&error=nofile");
  }

  const store = getStore();
  const { headerMap, rows } = await loadWorksheetRows(file as File);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = pick(row, headerMap, PROJECT_ALIASES.name);
    const clientName = pick(row, headerMap, PROJECT_ALIASES.client);
    if (!name && !clientName) {
      skipped++;
      continue;
    }

    const clientId = resolveOrCreateClient(store, clientName);
    if (!clientId) {
      skipped++;
      continue;
    }

    const now = new Date();
    const startDate = parseDateOrDefault(pick(row, headerMap, PROJECT_ALIASES.startDate), now);
    const deadline = parseDateOrDefault(
      pick(row, headerMap, PROJECT_ALIASES.deadline),
      new Date(startDate.getTime() + 180 * 86400000)
    );
    const status = matchEnum(pick(row, headerMap, PROJECT_ALIASES.status), PROJECT_STATUSES, "Planning");
    const id = nextEntityId("PRJ", store.projects);

    const project: Project = {
      id,
      name: name || `${clientName} Project`,
      category: matchEnum(pick(row, headerMap, PROJECT_ALIASES.category), PROJECT_CATEGORIES, "Residential"),
      clientId,
      address: pick(row, headerMap, PROJECT_ALIASES.address),
      city: pick(row, headerMap, PROJECT_ALIASES.city),
      state: pick(row, headerMap, PROJECT_ALIASES.state),
      status,
      riskLevel: matchEnum(pick(row, headerMap, PROJECT_ALIASES.riskLevel), RISK_LEVELS, "Medium"),
      budget: parseNumber(pick(row, headerMap, PROJECT_ALIASES.budget), 0),
      spent: 0,
      invoicedToDate: 0,
      startDate: startDate.toISOString(),
      deadline: deadline.toISOString(),
      progress: status === "Completed" ? 100 : status === "In Progress" ? 5 : 0,
      teamIds: [],
      projectManagerId: store.employees[0]?.id ?? "",
      photos: [],
      filesCount: 0,
      milestones: buildDefaultMilestones(id, startDate, deadline),
      comments: [],
      activity: [{ id: `${id}-AC0`, actor: "System", action: "imported this project from a spreadsheet", date: now.toISOString() }],
      description: pick(row, headerMap, PROJECT_ALIASES.description) || "Imported via Excel.",
    };

    store.projects.push(project);
    imported++;
  }

  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/import?type=projects&imported=${imported}&skipped=${skipped}`);
}
