"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import { getStore } from "./data/store";
import { nextEntityId } from "./data/ids";
import { addEntity, patchEntity, writeOverlay, type Overlay } from "./data/overlay";
import { normalizeHeader, pick, cellToString, parseNumber, parseDateOrDefault, matchEnum } from "./data/import-helpers";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  RISK_LEVELS,
  TEAM_SPECIALTIES,
  TEAM_STATUSES,
  CLIENT_STATUSES,
  TASK_PRIORITIES,
  EQUIPMENT_TYPES,
  EQUIPMENT_STATUSES,
  MATERIAL_CATEGORIES,
} from "./data/constants";
import type { Project, Team, Client, Milestone, ActivityItem, Task, Equipment, Material } from "./data/types";

/** Finds a client by name in `clientsPool`, or creates one and records it in the overlay.
 *  `clientsPool` is mutated locally so repeated calls within the same action (e.g. an Excel
 *  import loop) see clients created earlier in that same batch instead of colliding on IDs. */
function resolveOrCreateClient(clientsPool: Client[], overlay: Overlay, name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return clientsPool[0]?.id ?? "";
  const existing = clientsPool.find((c) => c.company.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing.id;

  const newClient: Client = {
    id: nextEntityId("CT", clientsPool),
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
  clientsPool.push(newClient);
  addEntity(overlay, "client", newClient);
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

/** Returns the `activity` field for a patch: the project's current feed with one new entry prepended. */
function withActivity(project: Project, action: string): ActivityItem[] {
  return [
    { id: `${project.id}-AC${project.activity.length}-${Date.now()}`, actor: "You", action, date: new Date().toISOString() },
    ...project.activity,
  ];
}

export async function createProjectAction(formData: FormData) {
  const store = await getStore();

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

  const clientName = String(formData.get("clientName") || "");

  const requestedPmId = String(formData.get("projectManagerId") || "");
  const projectManagerId = store.employees.some((e) => e.id === requestedPmId) ? requestedPmId : store.employees[0]?.id ?? "";

  const teamIds = formData.getAll("teamIds").map(String).filter((id) => store.teams.some((t) => t.id === id));

  const id = nextEntityId("PRJ", store.projects);
  const activity: ActivityItem[] = [
    { id: `${id}-AC0`, actor: "You", action: "created this project", date: now.toISOString() },
  ];

  await writeOverlay((overlay) => {
    const clientId = resolveOrCreateClient([...store.clients], overlay, clientName);

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
    addEntity(overlay, "project", project);

    teamIds.forEach((tid) => {
      const team = store.teams.find((t) => t.id === tid);
      if (team && !team.currentProjectId) patchEntity(overlay, "team", tid, { currentProjectId: id });
    });
  });

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${id}`);
}

export async function createTeamAction(formData: FormData) {
  const store = await getStore();

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

  await writeOverlay((overlay) => {
    addEntity(overlay, "team", team);
    patchEntity(overlay, "employee", foremanId, { teamId: team.id });
    memberIds.forEach((mid) => patchEntity(overlay, "employee", mid, { teamId: team.id }));
  });

  revalidatePath("/teams");
  redirect(`/teams/${id}`);
}

export async function updateClientStatusAction(formData: FormData) {
  const clientId = String(formData.get("clientId") || "");
  const status = matchEnum(String(formData.get("status") || ""), CLIENT_STATUSES, "Lead");
  await writeOverlay((overlay) => {
    patchEntity(overlay, "client", clientId, { status });
  });
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

  const store = await getStore();
  const { headerMap, rows } = await loadWorksheetRows(file as File);
  const clientsPool = [...store.clients];

  let imported = 0;
  let skipped = 0;

  await writeOverlay((overlay) => {
    for (const row of rows) {
      const company = pick(row, headerMap, CLIENT_ALIASES.company);
      if (!company) {
        skipped++;
        continue;
      }
      const contactName = pick(row, headerMap, CLIENT_ALIASES.contactName);
      const contactEmail = pick(row, headerMap, CLIENT_ALIASES.contactEmail);
      const contactPhone = pick(row, headerMap, CLIENT_ALIASES.contactPhone);

      const id = nextEntityId("CT", clientsPool);
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
      clientsPool.push(client);
      addEntity(overlay, "client", client);
      imported++;
    }
  });

  revalidatePath("/clients");
  redirect(`/import?type=clients&imported=${imported}&skipped=${skipped}`);
}

export async function importProjectsAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/import?type=projects&error=nofile");
  }

  const store = await getStore();
  const { headerMap, rows } = await loadWorksheetRows(file as File);
  const clientsPool = [...store.clients];
  const projectsPool = [...store.projects];

  let imported = 0;
  let skipped = 0;

  await writeOverlay((overlay) => {
    for (const row of rows) {
      const name = pick(row, headerMap, PROJECT_ALIASES.name);
      const clientName = pick(row, headerMap, PROJECT_ALIASES.client);
      if (!name && !clientName) {
        skipped++;
        continue;
      }

      const clientId = resolveOrCreateClient(clientsPool, overlay, clientName);
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
      const id = nextEntityId("PRJ", projectsPool);

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

      projectsPool.push(project);
      addEntity(overlay, "project", project);
      imported++;
    }
  });

  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/import?type=projects&imported=${imported}&skipped=${skipped}`);
}

export async function updateProjectStatusAction(formData: FormData) {
  const store = await getStore();
  const projectId = String(formData.get("projectId") || "");
  const status = matchEnum(String(formData.get("status") || ""), PROJECT_STATUSES, "Planning");
  const project = store.projects.find((p) => p.id === projectId);

  if (project) {
    await writeOverlay((overlay) => {
      const patch: Record<string, unknown> = {
        status,
        activity: withActivity(project, `changed the project status to ${status}`),
      };
      if (status === "Completed") patch.progress = 100;
      patchEntity(overlay, "project", projectId, patch);
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateProjectAction(formData: FormData) {
  const store = await getStore();
  const projectId = String(formData.get("projectId") || "");
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) {
    redirect("/projects");
  }

  const name = String(formData.get("name") || "").trim() || project.name;
  const category = matchEnum(String(formData.get("category") || ""), PROJECT_CATEGORIES, project.category);
  const status = matchEnum(String(formData.get("status") || ""), PROJECT_STATUSES, project.status);
  const riskLevel = matchEnum(String(formData.get("riskLevel") || ""), RISK_LEVELS, project.riskLevel);
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const budget = parseNumber(String(formData.get("budget") || ""), project.budget);
  const description = String(formData.get("description") || "").trim() || project.description;

  const startDate = parseDateOrDefault(String(formData.get("startDate") || ""), new Date(project.startDate)).toISOString();
  const deadline = parseDateOrDefault(String(formData.get("deadline") || ""), new Date(project.deadline)).toISOString();

  const clientName = String(formData.get("clientName") || "");

  const requestedPmId = String(formData.get("projectManagerId") || "");
  const projectManagerId = store.employees.some((e) => e.id === requestedPmId) ? requestedPmId : project.projectManagerId;

  const teamIds = formData.getAll("teamIds").map(String).filter((id) => store.teams.some((t) => t.id === id));

  await writeOverlay((overlay) => {
    const patch: Record<string, unknown> = {
      name,
      category,
      status,
      riskLevel,
      address,
      city,
      state,
      budget,
      description,
      startDate,
      deadline,
      projectManagerId,
      teamIds,
      activity: withActivity(project, "updated the project details"),
    };
    if (clientName.trim()) patch.clientId = resolveOrCreateClient([...store.clients], overlay, clientName);
    if (status === "Completed") patch.progress = 100;

    patchEntity(overlay, "project", projectId, patch);

    teamIds.forEach((tid) => {
      const team = store.teams.find((t) => t.id === tid);
      if (team && !team.currentProjectId) patchEntity(overlay, "team", tid, { currentProjectId: projectId });
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}

export async function addProjectPhotosAction(formData: FormData) {
  // Photos are stored as base64 data URLs and can be several MB each — far too large for a
  // cookie. They're kept in-memory only (best-effort, same-instance) rather than persisted
  // through the session overlay; a cold start or a different serverless instance can lose them.
  const store = await getStore();
  const projectId = String(formData.get("projectId") || "");
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return;

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  let added = 0;
  for (const file of files) {
    if (file.size > 8 * 1024 * 1024) continue; // skip anything over 8MB to keep in-memory store lean
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    project.photos.push(`data:${mime};base64,${buffer.toString("base64")}`);
    added++;
  }

  if (added > 0) {
    await writeOverlay((overlay) => {
      patchEntity(overlay, "project", projectId, { activity: withActivity(project, `uploaded ${added} new site photo${added === 1 ? "" : "s"}`) });
    });
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectTaskAction(formData: FormData) {
  const store = await getStore();
  const projectId = String(formData.get("projectId") || "");
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return;

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const priority = matchEnum(String(formData.get("priority") || ""), TASK_PRIORITIES, "Medium");
  const dueDate = parseDateOrDefault(String(formData.get("dueDate") || ""), new Date(Date.now() + 14 * 86400000));
  const assigneeIds = formData
    .getAll("assigneeIds")
    .map(String)
    .filter((id) => store.employees.some((e) => e.id === id));

  const id = nextEntityId("TSK", store.tasks);
  const now = new Date();
  const task: Task = {
    id,
    title,
    description: String(formData.get("description") || "").trim(),
    projectId,
    status: "To Do",
    priority,
    assigneeIds,
    dueDate: dueDate.toISOString(),
    createdDate: now.toISOString(),
    attachments: 0,
    comments: 0,
    tags: [],
  };

  await writeOverlay((overlay) => {
    addEntity(overlay, "task", task);
    patchEntity(overlay, "project", projectId, { activity: withActivity(project, `added a new task: "${title}"`) });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}

export async function createEquipmentAction(formData: FormData) {
  const store = await getStore();
  const name = String(formData.get("name") || "").trim() || "New Equipment";
  const type = matchEnum(String(formData.get("type") || ""), EQUIPMENT_TYPES, "Excavator");
  const status = matchEnum(String(formData.get("status") || ""), EQUIPMENT_STATUSES, "Available");
  const location = String(formData.get("location") || "").trim() || "Main Equipment Yard";
  const requestedProjectId = String(formData.get("currentProjectId") || "");
  const currentProjectId = store.projects.some((p) => p.id === requestedProjectId) ? requestedProjectId : null;

  const id = nextEntityId("EQP", store.equipment);
  const suffix = id.split("-")[1].padStart(5, "0");
  const now = new Date();

  const equipment: Equipment = {
    id,
    name,
    type,
    status,
    currentProjectId,
    location,
    lastMaintenance: now.toISOString(),
    nextMaintenance: new Date(now.getTime() + 90 * 86400000).toISOString(),
    qrCode: `QR-EQP-${suffix}`,
    hoursUsed: 0,
    purchaseDate: now.toISOString(),
  };

  await writeOverlay((overlay) => {
    addEntity(overlay, "equipment", equipment);
  });

  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function updateEquipmentAction(formData: FormData) {
  const store = await getStore();
  const equipmentId = String(formData.get("equipmentId") || "");
  const equipment = store.equipment.find((e) => e.id === equipmentId);
  if (!equipment) {
    redirect("/equipment");
  }

  const requestedProjectId = String(formData.get("currentProjectId") || "");

  await writeOverlay((overlay) => {
    patchEntity(overlay, "equipment", equipmentId, {
      name: String(formData.get("name") || "").trim() || equipment.name,
      type: matchEnum(String(formData.get("type") || ""), EQUIPMENT_TYPES, equipment.type),
      status: matchEnum(String(formData.get("status") || ""), EQUIPMENT_STATUSES, equipment.status),
      location: String(formData.get("location") || "").trim() || equipment.location,
      hoursUsed: parseNumber(String(formData.get("hoursUsed") || ""), equipment.hoursUsed),
      lastMaintenance: parseDateOrDefault(String(formData.get("lastMaintenance") || ""), new Date(equipment.lastMaintenance)).toISOString(),
      nextMaintenance: parseDateOrDefault(String(formData.get("nextMaintenance") || ""), new Date(equipment.nextMaintenance)).toISOString(),
      currentProjectId: store.projects.some((p) => p.id === requestedProjectId) ? requestedProjectId : null,
    });
  });

  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function updateEquipmentStatusAction(formData: FormData) {
  const equipmentId = String(formData.get("equipmentId") || "");
  const status = matchEnum(String(formData.get("status") || ""), EQUIPMENT_STATUSES, "Available");
  await writeOverlay((overlay) => {
    patchEntity(overlay, "equipment", equipmentId, { status });
  });
  revalidatePath("/equipment");
}

export async function createMaterialAction(formData: FormData) {
  const store = await getStore();
  const name = String(formData.get("name") || "").trim() || "New Material";
  const category = matchEnum(String(formData.get("category") || ""), MATERIAL_CATEGORIES, "Finishing");
  const unit = String(formData.get("unit") || "").trim() || "unit";
  const quantity = parseNumber(String(formData.get("quantity") || ""), 0);
  const reorderLevel = parseNumber(String(formData.get("reorderLevel") || ""), 20);
  const unitCost = parseNumber(String(formData.get("unitCost") || ""), 0);
  const warehouseLocation = String(formData.get("warehouseLocation") || "").trim() || "Aisle 1 - Bin A1";
  const requestedSupplierId = String(formData.get("supplierId") || "");
  const supplierId = store.suppliers.some((s) => s.id === requestedSupplierId) ? requestedSupplierId : store.suppliers[0]?.id ?? "";

  const id = nextEntityId("MAT", store.materials);
  const suffix = id.split("-")[1].padStart(5, "0");

  const material: Material = {
    id,
    name,
    category,
    sku: `SKU-${suffix}`,
    quantity,
    unit,
    reorderLevel,
    warehouseLocation,
    supplierId,
    unitCost,
    qrCode: `QR-MAT-${suffix}`,
  };

  await writeOverlay((overlay) => {
    addEntity(overlay, "material", material);
  });

  revalidatePath("/warehouse");
  redirect("/warehouse");
}

export async function updateMaterialAction(formData: FormData) {
  const store = await getStore();
  const materialId = String(formData.get("materialId") || "");
  const material = store.materials.find((m) => m.id === materialId);
  if (!material) {
    redirect("/warehouse");
  }

  const requestedSupplierId = String(formData.get("supplierId") || "");

  await writeOverlay((overlay) => {
    patchEntity(overlay, "material", materialId, {
      name: String(formData.get("name") || "").trim() || material.name,
      category: matchEnum(String(formData.get("category") || ""), MATERIAL_CATEGORIES, material.category),
      unit: String(formData.get("unit") || "").trim() || material.unit,
      quantity: parseNumber(String(formData.get("quantity") || ""), material.quantity),
      reorderLevel: parseNumber(String(formData.get("reorderLevel") || ""), material.reorderLevel),
      unitCost: parseNumber(String(formData.get("unitCost") || ""), material.unitCost),
      warehouseLocation: String(formData.get("warehouseLocation") || "").trim() || material.warehouseLocation,
      ...(store.suppliers.some((s) => s.id === requestedSupplierId) ? { supplierId: requestedSupplierId } : {}),
    });
  });

  revalidatePath("/warehouse");
  redirect("/warehouse");
}
