"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { requireAdmin, requireProjectAccess } from "./auth";
import { nextEntityId } from "./data/ids";
import { normalizeHeader, pick, cellToString, parseNumber, parseDateOrDefault, matchEnum } from "./data/import-helpers";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  RISK_LEVELS,
  TEAM_SPECIALTIES,
  TEAM_STATUSES,
  CLIENT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  EQUIPMENT_TYPES,
  EQUIPMENT_STATUSES,
  MATERIAL_CATEGORIES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_PERMISSIONS,
  EMPLOYMENT_TYPES,
  SUB_TRADES,
  SUBCONTRACTOR_STATUSES,
} from "./data/constants";
import type { Milestone, ActivityItem, TaskStatus, TaskPriority } from "./data/types";

/** Finds a client by (case-insensitive) company name, or creates one. */
async function resolveOrCreateClient(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    const first = await prisma.client.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
    return first?.id ?? "";
  }

  const existing = await prisma.client.findFirst({
    where: { company: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const existingIds = await prisma.client.findMany({ select: { id: true } });
  const id = nextEntityId("CT", existingIds);
  await prisma.client.create({
    data: {
      id,
      company: trimmed,
      industry: "General Contracting",
      contacts: [],
      address: "",
      city: "",
      state: "",
      status: "Lead",
      since: new Date(),
      totalProjects: 0,
      totalInvoiced: 0,
      outstandingBalance: 0,
      communications: [],
    },
  });
  return id;
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

/** Builds the `activity` field for an update: the row's current feed with one new entry prepended. */
function withActivity(current: { id: string; activity: unknown }, action: string): Prisma.InputJsonValue {
  const existing = (current.activity as ActivityItem[] | null) ?? [];
  const next: ActivityItem[] = [{ id: `${current.id}-AC${existing.length}-${Date.now()}`, actor: "You", action, date: new Date().toISOString() }, ...existing];
  return next as unknown as Prisma.InputJsonValue;
}

/** Casts a strictly-typed JS value (our domain interfaces) to Prisma's Json input type. */
function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function createProjectAction(formData: FormData) {
  await requireAdmin();
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
  const deadline = parseDateOrDefault(String(formData.get("deadline") || ""), new Date(startDate.getTime() + 180 * 86400000));

  const clientId = await resolveOrCreateClient(String(formData.get("clientName") || ""));

  const requestedPmId = String(formData.get("projectManagerId") || "");
  const pmExists = requestedPmId && (await prisma.employee.findUnique({ where: { id: requestedPmId }, select: { id: true } }));
  const projectManagerId = pmExists ? requestedPmId : (await prisma.employee.findFirst({ orderBy: { id: "asc" }, select: { id: true } }))?.id ?? "";

  const requestedTeamIds = formData.getAll("teamIds").map(String);
  const validTeams = requestedTeamIds.length ? await prisma.team.findMany({ where: { id: { in: requestedTeamIds } }, select: { id: true } }) : [];
  const teamIds = validTeams.map((t) => t.id);

  const existingIds = await prisma.project.findMany({ select: { id: true } });
  const id = nextEntityId("PRJ", existingIds);
  const activity: ActivityItem[] = [{ id: `${id}-AC0`, actor: "You", action: "created this project", date: now.toISOString() }];

  await prisma.project.create({
    data: {
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
      startDate,
      deadline,
      progress: status === "Completed" ? 100 : status === "In Progress" ? 5 : 0,
      teamIds,
      projectManagerId,
      photos: [],
      filesCount: 0,
      milestones: asJson(buildDefaultMilestones(id, startDate, deadline)),
      comments: [],
      activity: asJson(activity),
      description,
    },
  });

  if (teamIds.length) {
    await prisma.team.updateMany({ where: { id: { in: teamIds }, currentProjectId: null }, data: { currentProjectId: id } });
  }

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${id}`);
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") || "");
  await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const specialty = matchEnum(String(formData.get("specialty") || ""), TEAM_SPECIALTIES, "General Labor");
  const status = matchEnum(String(formData.get("status") || ""), TEAM_STATUSES, "Available");
  const callsign = String(formData.get("callsign") || "").trim();

  const requestedForemanId = String(formData.get("foremanId") || "");
  const foremanExists = requestedForemanId && (await prisma.employee.findUnique({ where: { id: requestedForemanId }, select: { id: true } }));
  const foremanId = foremanExists ? requestedForemanId : (await prisma.employee.findFirst({ orderBy: { id: "asc" }, select: { id: true } }))?.id ?? "";

  const requestedMemberIds = formData.getAll("memberIds").map(String).filter((mid) => mid !== foremanId);
  const validMembers = requestedMemberIds.length
    ? await prisma.employee.findMany({ where: { id: { in: requestedMemberIds } }, select: { id: true } })
    : [];
  const memberIds = validMembers.map((e) => e.id);

  const existingIds = await prisma.team.findMany({ select: { id: true } });
  const id = nextEntityId("TEAM", existingIds);
  const name = callsign ? `Crew ${callsign} — ${specialty}` : `Crew ${id.split("-")[1]} — ${specialty}`;

  await prisma.team.create({
    data: {
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
    },
  });

  if (foremanId) await prisma.employee.update({ where: { id: foremanId }, data: { teamId: id } }).catch(() => {});
  if (memberIds.length) await prisma.employee.updateMany({ where: { id: { in: memberIds } }, data: { teamId: id } });

  revalidatePath("/teams");
  redirect(`/teams/${id}`);
}

export async function deleteTeamAction(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") || "");
  await prisma.employee.updateMany({ where: { teamId }, data: { teamId: null } });
  await prisma.team.delete({ where: { id: teamId } }).catch(() => {});
  revalidatePath("/teams");
  redirect("/teams");
}

export async function updateClientStatusAction(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") || "");
  const status = matchEnum(String(formData.get("status") || ""), CLIENT_STATUSES, "Lead");
  await prisma.client.update({ where: { id: clientId }, data: { status } }).catch(() => {});
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientAction(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") || "");
  await prisma.client.delete({ where: { id: clientId } }).catch(() => {});
  revalidatePath("/clients");
  redirect("/clients");
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
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/import?type=clients&error=nofile");
  }

  const { headerMap, rows } = await loadWorksheetRows(file as File);
  const idPool = await prisma.client.findMany({ select: { id: true } });

  let imported = 0;
  let skipped = 0;
  const toCreate: Prisma.ClientCreateManyInput[] = [];

  for (const row of rows) {
    const company = pick(row, headerMap, CLIENT_ALIASES.company);
    if (!company) {
      skipped++;
      continue;
    }
    const contactName = pick(row, headerMap, CLIENT_ALIASES.contactName);
    const contactEmail = pick(row, headerMap, CLIENT_ALIASES.contactEmail);
    const contactPhone = pick(row, headerMap, CLIENT_ALIASES.contactPhone);

    const id = nextEntityId("CT", idPool);
    idPool.push({ id });

    toCreate.push({
      id,
      company,
      industry: pick(row, headerMap, CLIENT_ALIASES.industry) || "General Contracting",
      contacts: asJson(
        contactName || contactEmail || contactPhone
          ? [{ id: `${id}-C0`, name: contactName || "Primary Contact", title: "Contact", email: contactEmail, phone: contactPhone }]
          : []
      ),
      address: pick(row, headerMap, CLIENT_ALIASES.address),
      city: pick(row, headerMap, CLIENT_ALIASES.city),
      state: pick(row, headerMap, CLIENT_ALIASES.state),
      status: matchEnum(pick(row, headerMap, CLIENT_ALIASES.status), CLIENT_STATUSES, "Lead"),
      since: new Date(),
      totalProjects: 0,
      totalInvoiced: 0,
      outstandingBalance: 0,
      communications: [],
    });
    imported++;
  }

  if (toCreate.length) await prisma.client.createMany({ data: toCreate });

  revalidatePath("/clients");
  redirect(`/import?type=clients&imported=${imported}&skipped=${skipped}`);
}

export async function importProjectsAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/import?type=projects&error=nofile");
  }

  const { headerMap, rows } = await loadWorksheetRows(file as File);
  const idPool = await prisma.project.findMany({ select: { id: true } });
  const defaultPmId = (await prisma.employee.findFirst({ orderBy: { id: "asc" }, select: { id: true } }))?.id ?? "";

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = pick(row, headerMap, PROJECT_ALIASES.name);
    const clientName = pick(row, headerMap, PROJECT_ALIASES.client);
    if (!name && !clientName) {
      skipped++;
      continue;
    }

    const clientId = await resolveOrCreateClient(clientName);
    if (!clientId) {
      skipped++;
      continue;
    }

    const now = new Date();
    const startDate = parseDateOrDefault(pick(row, headerMap, PROJECT_ALIASES.startDate), now);
    const deadline = parseDateOrDefault(pick(row, headerMap, PROJECT_ALIASES.deadline), new Date(startDate.getTime() + 180 * 86400000));
    const status = matchEnum(pick(row, headerMap, PROJECT_ALIASES.status), PROJECT_STATUSES, "Planning");
    const id = nextEntityId("PRJ", idPool);
    idPool.push({ id });

    await prisma.project.create({
      data: {
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
        startDate,
        deadline,
        progress: status === "Completed" ? 100 : status === "In Progress" ? 5 : 0,
        teamIds: [],
        projectManagerId: defaultPmId,
        photos: [],
        filesCount: 0,
        milestones: asJson(buildDefaultMilestones(id, startDate, deadline)),
        comments: [],
        activity: asJson([{ id: `${id}-AC0`, actor: "System", action: "imported this project from a spreadsheet", date: now.toISOString() }]),
        description: pick(row, headerMap, PROJECT_ALIASES.description) || "Imported via Excel.",
      },
    });
    imported++;
  }

  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/import?type=projects&imported=${imported}&skipped=${skipped}`);
}

export async function updateProjectStatusAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  await requireProjectAccess(projectId);
  const status = matchEnum(String(formData.get("status") || ""), PROJECT_STATUSES, "Planning");
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (project) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status,
        progress: status === "Completed" ? 100 : project.progress,
        activity: withActivity(project, `changed the project status to ${status}`),
      },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateProjectAction(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") || "");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    redirect("/projects");
  }

  const name = String(formData.get("name") || "").trim() || project.name;
  const category = matchEnum(String(formData.get("category") || ""), PROJECT_CATEGORIES, project.category as (typeof PROJECT_CATEGORIES)[number]);
  const status = matchEnum(String(formData.get("status") || ""), PROJECT_STATUSES, project.status as (typeof PROJECT_STATUSES)[number]);
  const riskLevel = matchEnum(String(formData.get("riskLevel") || ""), RISK_LEVELS, project.riskLevel as (typeof RISK_LEVELS)[number]);
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const budget = parseNumber(String(formData.get("budget") || ""), project.budget);
  const description = String(formData.get("description") || "").trim() || project.description;

  const startDate = parseDateOrDefault(String(formData.get("startDate") || ""), project.startDate);
  const deadline = parseDateOrDefault(String(formData.get("deadline") || ""), project.deadline);

  const clientName = String(formData.get("clientName") || "");
  const clientId = clientName.trim() ? await resolveOrCreateClient(clientName) : project.clientId;

  const requestedPmId = String(formData.get("projectManagerId") || "");
  const pmExists = requestedPmId && (await prisma.employee.findUnique({ where: { id: requestedPmId }, select: { id: true } }));
  const projectManagerId = pmExists ? requestedPmId : project.projectManagerId;

  const requestedTeamIds = formData.getAll("teamIds").map(String);
  const validTeams = requestedTeamIds.length ? await prisma.team.findMany({ where: { id: { in: requestedTeamIds } }, select: { id: true } }) : [];
  const teamIds = validTeams.map((t) => t.id);

  await prisma.project.update({
    where: { id: projectId },
    data: {
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
      clientId,
      projectManagerId,
      teamIds,
      progress: status === "Completed" ? 100 : project.progress,
      activity: withActivity(project, "updated the project details"),
    },
  });

  if (teamIds.length) {
    await prisma.team.updateMany({ where: { id: { in: teamIds }, currentProjectId: null }, data: { currentProjectId: projectId } });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}

export async function addProjectPhotosAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  await requireProjectAccess(projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const newPhotos: string[] = [];
  for (const file of files) {
    if (file.size > 8 * 1024 * 1024) continue; // skip anything over 8MB
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    newPhotos.push(`data:${mime};base64,${buffer.toString("base64")}`);
  }

  if (newPhotos.length) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        photos: { push: newPhotos },
        activity: withActivity(project, `uploaded ${newPhotos.length} new site photo${newPhotos.length === 1 ? "" : "s"}`),
      },
    });
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectTaskAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  await requireProjectAccess(projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const priority = matchEnum(String(formData.get("priority") || ""), TASK_PRIORITIES, "Medium");
  const dueDate = parseDateOrDefault(String(formData.get("dueDate") || ""), new Date(Date.now() + 14 * 86400000));
  const requestedAssigneeIds = formData.getAll("assigneeIds").map(String);
  const validAssignees = requestedAssigneeIds.length
    ? await prisma.employee.findMany({ where: { id: { in: requestedAssigneeIds } }, select: { id: true } })
    : [];
  const assigneeIds = validAssignees.map((e) => e.id);

  const existingIds = await prisma.task.findMany({ select: { id: true } });
  const id = nextEntityId("TSK", existingIds);
  const now = new Date();

  await prisma.task.create({
    data: {
      id,
      title,
      description: String(formData.get("description") || "").trim(),
      projectId,
      status: "To Do",
      priority,
      assigneeIds,
      dueDate,
      createdDate: now,
      attachments: 0,
      comments: 0,
      tags: [],
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { activity: withActivity(project, `added a new task: "${title}"`) },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}

export async function deleteTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const projectId = String(formData.get("projectId") || "");
  await requireProjectAccess(projectId);
  await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}

/** Looks up the task's owning project and enforces access against it. */
async function requireTaskAccess(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) redirect("/tasks");
  await requireProjectAccess(task.projectId);
  return task;
}

/**
 * Moves a task between Kanban columns. Called directly from the board on drop, so it
 * takes plain arguments rather than FormData.
 */
export async function moveTaskStatusAction(taskId: string, status: string) {
  const task = await requireTaskAccess(taskId);
  const nextStatus = matchEnum(status, TASK_STATUSES, "To Do");

  await prisma.task.update({ where: { id: taskId }, data: { status: nextStatus } });

  const project = await prisma.project.findUnique({ where: { id: task.projectId } });
  if (project) {
    await prisma.project.update({
      where: { id: task.projectId },
      data: { activity: withActivity(project, `moved a task to ${nextStatus}`) },
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
}

/** Creates a task from the Tasks workspace, where the project is chosen in the form. */
export async function createTaskAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  await requireProjectAccess(projectId);

  const title = String(formData.get("title") || "").trim();
  if (!title) redirect("/tasks?error=title");

  const priority = matchEnum(String(formData.get("priority") || ""), TASK_PRIORITIES, "Medium");
  const status = matchEnum(String(formData.get("status") || ""), TASK_STATUSES, "To Do");
  const dueDate = parseDateOrDefault(String(formData.get("dueDate") || ""), new Date(Date.now() + 14 * 86400000));

  const requestedAssigneeIds = formData.getAll("assigneeIds").map(String).filter(Boolean);
  const validAssignees = requestedAssigneeIds.length
    ? await prisma.employee.findMany({ where: { id: { in: requestedAssigneeIds } }, select: { id: true } })
    : [];

  const existingIds = await prisma.task.findMany({ select: { id: true } });
  const id = nextEntityId("TSK", existingIds);

  await prisma.task.create({
    data: {
      id,
      title,
      description: String(formData.get("description") || "").trim(),
      projectId,
      status,
      priority,
      assigneeIds: validAssignees.map((e) => e.id),
      dueDate,
      createdDate: new Date(),
      attachments: 0,
      comments: 0,
      tags: formData.getAll("tags").map(String).filter(Boolean),
    },
  });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project) {
    await prisma.project.update({
      where: { id: projectId },
      data: { activity: withActivity(project, `added a new task: "${title}"`) },
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  redirect("/tasks?created=1");
}

/** Edits an existing task in place from the Tasks workspace. */
export async function updateTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  await requireTaskAccess(taskId);

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) redirect("/tasks");

  // Reassigning to a different project is allowed, but only to one the user can reach.
  const requestedProjectId = String(formData.get("projectId") || "");
  let projectId = task.projectId;
  if (requestedProjectId && requestedProjectId !== task.projectId) {
    await requireProjectAccess(requestedProjectId);
    projectId = requestedProjectId;
  }

  const requestedAssigneeIds = formData.getAll("assigneeIds").map(String).filter(Boolean);
  const validAssignees = requestedAssigneeIds.length
    ? await prisma.employee.findMany({ where: { id: { in: requestedAssigneeIds } }, select: { id: true } })
    : [];

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: String(formData.get("title") || "").trim() || task.title,
      description: String(formData.get("description") || "").trim(),
      projectId,
      status: matchEnum(String(formData.get("status") || ""), TASK_STATUSES, task.status as TaskStatus),
      priority: matchEnum(String(formData.get("priority") || ""), TASK_PRIORITIES, task.priority as TaskPriority),
      assigneeIds: validAssignees.map((e) => e.id),
      dueDate: parseDateOrDefault(String(formData.get("dueDate") || ""), task.dueDate),
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  redirect("/tasks?updated=1");
}

/** Deletes a task from the Tasks workspace (project id resolved server-side). */
export async function deleteTaskByIdAction(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const task = await requireTaskAccess(taskId);
  await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
}

/* ── Employees ─────────────────────────────────────────────────────────────── */

function employeeFieldsFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    role: String(formData.get("role") || "").trim() || "General Laborer",
    department: matchEnum(String(formData.get("department") || ""), EMPLOYEE_DEPARTMENTS, "Construction"),
    permission: matchEnum(String(formData.get("permission") || ""), EMPLOYEE_PERMISSIONS, "Employee"),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    employmentType: matchEnum(String(formData.get("employmentType") || ""), EMPLOYMENT_TYPES, "Full-time"),
    status: matchEnum(String(formData.get("status") || ""), EMPLOYEE_STATUSES, "Active"),
    city: String(formData.get("city") || "").trim(),
    weeklyHours: parseNumber(String(formData.get("weeklyHours") || ""), 40),
    vacationTotal: parseNumber(String(formData.get("vacationTotal") || ""), 20),
  };
}

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin();
  const fields = employeeFieldsFromForm(formData);
  if (!fields.name) redirect("/employees/new?error=name");

  const requestedTeamId = String(formData.get("teamId") || "").trim();
  const teamExists = requestedTeamId && (await prisma.team.findUnique({ where: { id: requestedTeamId }, select: { id: true } }));

  const existingIds = await prisma.employee.findMany({ select: { id: true } });
  const id = nextEntityId("EMP", existingIds);

  await prisma.employee.create({
    data: {
      id,
      ...fields,
      hireDate: parseDateOrDefault(String(formData.get("hireDate") || ""), new Date()),
      teamId: teamExists ? requestedTeamId : null,
      vacationUsed: 0,
      payrollStatus: "Pending",
      performanceScore: 75,
      avatarSeed: id,
      certifications: formData.getAll("certifications").map(String).filter(Boolean),
    },
  });

  revalidatePath("/employees");
  redirect(`/employees/${id}`);
}

export async function updateEmployeeAction(formData: FormData) {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") || "");
  const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!existing) redirect("/employees");

  const fields = employeeFieldsFromForm(formData);
  const requestedTeamId = String(formData.get("teamId") || "").trim();
  const teamExists = requestedTeamId && (await prisma.team.findUnique({ where: { id: requestedTeamId }, select: { id: true } }));

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...fields,
      name: fields.name || existing.name,
      hireDate: parseDateOrDefault(String(formData.get("hireDate") || ""), existing.hireDate),
      teamId: teamExists ? requestedTeamId : null,
    },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}`);
}

export async function deleteEmployeeAction(formData: FormData) {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") || "");
  // Employees are referenced by id from projects/tasks/teams as plain scalars, so clear
  // the places that would otherwise point at a missing person.
  await prisma.team.updateMany({ where: { foremanId: employeeId }, data: { foremanId: "" } });
  await prisma.employee.delete({ where: { id: employeeId } }).catch(() => {});
  revalidatePath("/employees");
  redirect("/employees");
}

const EMPLOYEE_ALIASES = {
  name: ["name", "fullname", "employeename", "employee"].map(normalizeHeader),
  role: ["role", "position", "jobtitle", "title"].map(normalizeHeader),
  department: ["department", "dept", "division"].map(normalizeHeader),
  email: ["email", "emailaddress", "workemail"].map(normalizeHeader),
  phone: ["phone", "telephone", "mobile", "phonenumber"].map(normalizeHeader),
  city: ["city", "town", "location"].map(normalizeHeader),
  employmentType: ["employmenttype", "type", "contracttype"].map(normalizeHeader),
  status: ["status", "employeestatus"].map(normalizeHeader),
  permission: ["permission", "accesslevel", "access", "systemrole"].map(normalizeHeader),
  hireDate: ["hiredate", "startdate", "joined", "joindate"].map(normalizeHeader),
  weeklyHours: ["weeklyhours", "hours", "hoursperweek"].map(normalizeHeader),
};

export async function importEmployeesAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/import?type=employees&error=nofile");
  }

  const { headerMap, rows } = await loadWorksheetRows(file as File);
  const idPool = await prisma.employee.findMany({ select: { id: true } });

  let imported = 0;
  let skipped = 0;
  const toCreate: Prisma.EmployeeCreateManyInput[] = [];

  for (const row of rows) {
    const name = pick(row, headerMap, EMPLOYEE_ALIASES.name);
    if (!name) {
      skipped++;
      continue;
    }

    const id = nextEntityId("EMP", idPool);
    idPool.push({ id });

    toCreate.push({
      id,
      name,
      role: pick(row, headerMap, EMPLOYEE_ALIASES.role) || "General Laborer",
      department: matchEnum(pick(row, headerMap, EMPLOYEE_ALIASES.department), EMPLOYEE_DEPARTMENTS, "Construction"),
      permission: matchEnum(pick(row, headerMap, EMPLOYEE_ALIASES.permission), EMPLOYEE_PERMISSIONS, "Employee"),
      email: pick(row, headerMap, EMPLOYEE_ALIASES.email),
      phone: pick(row, headerMap, EMPLOYEE_ALIASES.phone),
      hireDate: parseDateOrDefault(pick(row, headerMap, EMPLOYEE_ALIASES.hireDate), new Date()),
      employmentType: matchEnum(pick(row, headerMap, EMPLOYEE_ALIASES.employmentType), EMPLOYMENT_TYPES, "Full-time"),
      status: matchEnum(pick(row, headerMap, EMPLOYEE_ALIASES.status), EMPLOYEE_STATUSES, "Active"),
      teamId: null,
      vacationUsed: 0,
      vacationTotal: 20,
      weeklyHours: parseNumber(pick(row, headerMap, EMPLOYEE_ALIASES.weeklyHours), 40),
      payrollStatus: "Pending",
      performanceScore: 75,
      avatarSeed: id,
      certifications: [],
      city: pick(row, headerMap, EMPLOYEE_ALIASES.city),
    });
    imported++;
  }

  if (toCreate.length) await prisma.employee.createMany({ data: toCreate });

  revalidatePath("/employees");
  redirect(`/import?type=employees&imported=${imported}&skipped=${skipped}`);
}

/* ── Subcontractors ────────────────────────────────────────────────────────── */

function subcontractorFieldsFromForm(formData: FormData) {
  return {
    company: String(formData.get("company") || "").trim(),
    trade: matchEnum(String(formData.get("trade") || ""), SUB_TRADES, "Electrical"),
    contactName: String(formData.get("contactName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    status: matchEnum(String(formData.get("status") || ""), SUBCONTRACTOR_STATUSES, "Active"),
    rating: Math.min(5, Math.max(0, parseNumber(String(formData.get("rating") || ""), 4))),
  };
}

export async function createSubcontractorAction(formData: FormData) {
  await requireAdmin();
  const fields = subcontractorFieldsFromForm(formData);
  if (!fields.company) redirect("/subcontractors/new?error=company");

  const requestedProjectIds = formData.getAll("activeProjectIds").map(String).filter(Boolean);
  const validProjects = requestedProjectIds.length
    ? await prisma.project.findMany({ where: { id: { in: requestedProjectIds } }, select: { id: true } })
    : [];

  const existingIds = await prisma.subcontractor.findMany({ select: { id: true } });
  const id = nextEntityId("SUB", existingIds);

  await prisma.subcontractor.create({
    data: {
      id,
      ...fields,
      jobsCompleted: parseNumber(String(formData.get("jobsCompleted") || ""), 0),
      activeProjectIds: validProjects.map((p) => p.id),
      totalInvoiced: parseNumber(String(formData.get("totalInvoiced") || ""), 0),
    },
  });

  revalidatePath("/subcontractors");
  redirect("/subcontractors");
}

export async function updateSubcontractorAction(formData: FormData) {
  await requireAdmin();
  const subcontractorId = String(formData.get("subcontractorId") || "");
  const existing = await prisma.subcontractor.findUnique({ where: { id: subcontractorId } });
  if (!existing) redirect("/subcontractors");

  const fields = subcontractorFieldsFromForm(formData);
  const requestedProjectIds = formData.getAll("activeProjectIds").map(String).filter(Boolean);
  const validProjects = requestedProjectIds.length
    ? await prisma.project.findMany({ where: { id: { in: requestedProjectIds } }, select: { id: true } })
    : [];

  await prisma.subcontractor.update({
    where: { id: subcontractorId },
    data: {
      ...fields,
      company: fields.company || existing.company,
      jobsCompleted: parseNumber(String(formData.get("jobsCompleted") || ""), existing.jobsCompleted),
      activeProjectIds: validProjects.map((p) => p.id),
      totalInvoiced: parseNumber(String(formData.get("totalInvoiced") || ""), existing.totalInvoiced),
    },
  });

  revalidatePath("/subcontractors");
  redirect("/subcontractors");
}

export async function deleteSubcontractorAction(formData: FormData) {
  await requireAdmin();
  const subcontractorId = String(formData.get("subcontractorId") || "");
  await prisma.subcontractor.delete({ where: { id: subcontractorId } }).catch(() => {});
  revalidatePath("/subcontractors");
  redirect("/subcontractors");
}

export async function createEquipmentAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim() || "New Equipment";
  const type = matchEnum(String(formData.get("type") || ""), EQUIPMENT_TYPES, "Excavator");
  const status = matchEnum(String(formData.get("status") || ""), EQUIPMENT_STATUSES, "Available");
  const location = String(formData.get("location") || "").trim() || "Main Equipment Yard";
  const requestedProjectId = String(formData.get("currentProjectId") || "");
  const projectExists = requestedProjectId && (await prisma.project.findUnique({ where: { id: requestedProjectId }, select: { id: true } }));
  const currentProjectId = projectExists ? requestedProjectId : null;

  const existingIds = await prisma.equipment.findMany({ select: { id: true } });
  const id = nextEntityId("EQP", existingIds);
  const suffix = id.split("-")[1].padStart(5, "0");
  const now = new Date();

  await prisma.equipment.create({
    data: {
      id,
      name,
      type,
      status,
      currentProjectId,
      location,
      lastMaintenance: now,
      nextMaintenance: new Date(now.getTime() + 90 * 86400000),
      qrCode: `QR-EQP-${suffix}`,
      hoursUsed: 0,
      purchaseDate: now,
    },
  });

  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function updateEquipmentAction(formData: FormData) {
  await requireAdmin();
  const equipmentId = String(formData.get("equipmentId") || "");
  const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) {
    redirect("/equipment");
  }

  const requestedProjectId = String(formData.get("currentProjectId") || "");
  const projectExists = requestedProjectId && (await prisma.project.findUnique({ where: { id: requestedProjectId }, select: { id: true } }));

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      name: String(formData.get("name") || "").trim() || equipment.name,
      type: matchEnum(String(formData.get("type") || ""), EQUIPMENT_TYPES, equipment.type as (typeof EQUIPMENT_TYPES)[number]),
      status: matchEnum(String(formData.get("status") || ""), EQUIPMENT_STATUSES, equipment.status as (typeof EQUIPMENT_STATUSES)[number]),
      location: String(formData.get("location") || "").trim() || equipment.location,
      hoursUsed: parseNumber(String(formData.get("hoursUsed") || ""), equipment.hoursUsed),
      lastMaintenance: parseDateOrDefault(String(formData.get("lastMaintenance") || ""), equipment.lastMaintenance),
      nextMaintenance: parseDateOrDefault(String(formData.get("nextMaintenance") || ""), equipment.nextMaintenance),
      currentProjectId: projectExists ? requestedProjectId : null,
    },
  });

  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function updateEquipmentStatusAction(formData: FormData) {
  await requireAdmin();
  const equipmentId = String(formData.get("equipmentId") || "");
  const status = matchEnum(String(formData.get("status") || ""), EQUIPMENT_STATUSES, "Available");
  await prisma.equipment.update({ where: { id: equipmentId }, data: { status } }).catch(() => {});
  revalidatePath("/equipment");
}

export async function deleteEquipmentAction(formData: FormData) {
  await requireAdmin();
  const equipmentId = String(formData.get("equipmentId") || "");
  await prisma.equipment.delete({ where: { id: equipmentId } }).catch(() => {});
  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function createMaterialAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim() || "New Material";
  const category = matchEnum(String(formData.get("category") || ""), MATERIAL_CATEGORIES, "Finishing");
  const unit = String(formData.get("unit") || "").trim() || "unit";
  const quantity = parseNumber(String(formData.get("quantity") || ""), 0);
  const reorderLevel = parseNumber(String(formData.get("reorderLevel") || ""), 20);
  const unitCost = parseNumber(String(formData.get("unitCost") || ""), 0);
  const warehouseLocation = String(formData.get("warehouseLocation") || "").trim() || "Aisle 1 - Bin A1";
  const requestedSupplierId = String(formData.get("supplierId") || "");
  const supplierExists = requestedSupplierId && (await prisma.supplier.findUnique({ where: { id: requestedSupplierId }, select: { id: true } }));
  const supplierId = supplierExists ? requestedSupplierId : (await prisma.supplier.findFirst({ orderBy: { id: "asc" }, select: { id: true } }))?.id ?? "";

  const existingIds = await prisma.material.findMany({ select: { id: true } });
  const id = nextEntityId("MAT", existingIds);
  const suffix = id.split("-")[1].padStart(5, "0");

  await prisma.material.create({
    data: { id, name, category, sku: `SKU-${suffix}`, quantity, unit, reorderLevel, warehouseLocation, supplierId, unitCost, qrCode: `QR-MAT-${suffix}` },
  });

  revalidatePath("/warehouse");
  redirect("/warehouse");
}

export async function updateMaterialAction(formData: FormData) {
  await requireAdmin();
  const materialId = String(formData.get("materialId") || "");
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    redirect("/warehouse");
  }

  const requestedSupplierId = String(formData.get("supplierId") || "");
  const supplierExists = requestedSupplierId && (await prisma.supplier.findUnique({ where: { id: requestedSupplierId }, select: { id: true } }));

  await prisma.material.update({
    where: { id: materialId },
    data: {
      name: String(formData.get("name") || "").trim() || material.name,
      category: matchEnum(String(formData.get("category") || ""), MATERIAL_CATEGORIES, material.category),
      unit: String(formData.get("unit") || "").trim() || material.unit,
      quantity: parseNumber(String(formData.get("quantity") || ""), material.quantity),
      reorderLevel: parseNumber(String(formData.get("reorderLevel") || ""), material.reorderLevel),
      unitCost: parseNumber(String(formData.get("unitCost") || ""), material.unitCost),
      warehouseLocation: String(formData.get("warehouseLocation") || "").trim() || material.warehouseLocation,
      ...(supplierExists ? { supplierId: requestedSupplierId } : {}),
    },
  });

  revalidatePath("/warehouse");
  redirect("/warehouse");
}

export async function deleteMaterialAction(formData: FormData) {
  await requireAdmin();
  const materialId = String(formData.get("materialId") || "");
  await prisma.material.delete({ where: { id: materialId } }).catch(() => {});
  revalidatePath("/warehouse");
  redirect("/warehouse");
}
