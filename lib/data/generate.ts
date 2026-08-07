import { faker } from "@faker-js/faker";
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
  Material,
  PurchaseOrder,
  DocumentItem,
  AppNotification,
  ProjectStatus,
  TeamSpecialty,
  TaskStatus,
  TaskPriority,
  SubTrade,
  EquipmentType,
} from "./types";

const COUNTS = {
  projects: 40,
  employees: 120,
  teams: 18,
  clients: 400,
  tasks: 1500,
  invoices: 100,
  contracts: 80,
  subcontractors: 36,
  equipment: 54,
  materials: 90,
  suppliers: 22,
  purchaseOrders: 60,
  documents: 220,
  notifications: 30,
};

const CONSTRUCTION_ROLES = [
  "Project Manager",
  "Site Foreman",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Heavy Equipment Operator",
  "Mason",
  "HVAC Technician",
  "Laborer",
  "Safety Officer",
  "Estimator",
  "Architect",
  "Civil Engineer",
  "Surveyor",
  "Welder",
  "Painter",
  "Roofer",
  "Crane Operator",
  "Site Superintendent",
  "Quality Inspector",
];

const OFFICE_ROLES = [
  "HR Manager",
  "Payroll Specialist",
  "Accountant",
  "Financial Controller",
  "Procurement Officer",
  "Office Administrator",
  "IT Support Specialist",
  "Business Development Manager",
  "Marketing Coordinator",
];

const DEPARTMENTS_BY_ROLE: Record<string, Employee["department"]> = {
  "Project Manager": "Management",
  "Site Superintendent": "Management",
  "Site Foreman": "Construction",
  Carpenter: "Construction",
  Electrician: "Construction",
  Plumber: "Construction",
  "Heavy Equipment Operator": "Construction",
  Mason: "Construction",
  "HVAC Technician": "Construction",
  Laborer: "Construction",
  Welder: "Construction",
  Painter: "Construction",
  Roofer: "Construction",
  "Crane Operator": "Construction",
  "Safety Officer": "Safety",
  "Quality Inspector": "Safety",
  Estimator: "Finance",
  Architect: "Design",
  "Civil Engineer": "Design",
  Surveyor: "Design",
  "HR Manager": "Human Resources",
  "Payroll Specialist": "Human Resources",
  Accountant: "Finance",
  "Financial Controller": "Finance",
  "Procurement Officer": "Procurement",
  "Office Administrator": "Management",
  "IT Support Specialist": "Management",
  "Business Development Manager": "Management",
  "Marketing Coordinator": "Management",
};

const CERTIFICATIONS = [
  "OSHA 30",
  "OSHA 10",
  "First Aid / CPR",
  "Crane Operator License",
  "Confined Space Entry",
  "Scaffold Safety",
  "Fall Protection",
  "Forklift Certified",
  "LEED Green Associate",
  "PMP",
];

const TEAM_SPECIALTIES: TeamSpecialty[] = [
  "Framing",
  "Concrete",
  "Electrical",
  "Plumbing",
  "Roofing",
  "Masonry",
  "HVAC",
  "Excavation",
  "Finishing",
  "General Labor",
];

const PROJECT_TYPES: { prefix: string; category: Project["category"] }[] = [
  { prefix: "Residence", category: "Residential" },
  { prefix: "Tower", category: "Commercial" },
  { prefix: "Office Complex", category: "Commercial" },
  { prefix: "Bridge", category: "Infrastructure" },
  { prefix: "Highway Overpass", category: "Infrastructure" },
  { prefix: "Renovation", category: "Renovation" },
  { prefix: "Warehouse", category: "Industrial" },
  { prefix: "Manufacturing Plant", category: "Industrial" },
  { prefix: "Retail Plaza", category: "Commercial" },
  { prefix: "Apartment Complex", category: "Residential" },
  { prefix: "School Campus", category: "Commercial" },
  { prefix: "Medical Center", category: "Commercial" },
];

const TASK_VERBS = [
  "Pour foundation for",
  "Install rebar at",
  "Frame walls on",
  "Run electrical conduit in",
  "Install plumbing fixtures at",
  "Inspect structural beams on",
  "Apply drywall in",
  "Paint interior of",
  "Install roofing membrane on",
  "Lay concrete slab for",
  "Grade site for",
  "Install HVAC ductwork in",
  "Install windows on",
  "Excavate trench for",
  "Set up scaffolding on",
  "Order materials for",
  "Perform safety inspection at",
  "Coordinate subcontractor for",
  "Install insulation in",
  "Finish flooring in",
  "Install cabinetry in",
  "Landscape grounds at",
  "Test fire suppression system at",
  "Conduct final walkthrough of",
];

const LOCATIONS = [
  { area: "Zone A", floor: "Ground Floor" },
  { area: "Zone B", floor: "2nd Floor" },
  { area: "East Wing", floor: "3rd Floor" },
  { area: "West Wing", floor: "Rooftop" },
  { area: "North Block", floor: "Basement" },
  { area: "Main Structure", floor: "Level 4" },
];

const MATERIAL_CATALOG = [
  { name: "Ready-Mix Concrete", category: "Concrete", unit: "cu yd", cost: 145 },
  { name: "Rebar #5 Grade 60", category: "Steel", unit: "ton", cost: 890 },
  { name: "Structural Steel Beam I-12", category: "Steel", unit: "unit", cost: 620 },
  { name: "Dimensional Lumber 2x4x8", category: "Lumber", unit: "piece", cost: 6.2 },
  { name: "Plywood Sheathing 4x8", category: "Lumber", unit: "sheet", cost: 42 },
  { name: "Copper Wire 12 AWG", category: "Electrical", unit: "roll", cost: 118 },
  { name: "Circuit Breaker Panel", category: "Electrical", unit: "unit", cost: 240 },
  { name: "PVC Pipe 4in", category: "Plumbing", unit: "length", cost: 18 },
  { name: "Copper Pipe 1/2in", category: "Plumbing", unit: "length", cost: 24 },
  { name: "Drywall Sheet 4x8", category: "Finishing", unit: "sheet", cost: 14 },
  { name: "Ceramic Floor Tile", category: "Finishing", unit: "sq ft", cost: 4.5 },
  { name: "Interior Paint (5 gal)", category: "Finishing", unit: "bucket", cost: 95 },
  { name: "Insulation Batt R-19", category: "Finishing", unit: "roll", cost: 58 },
  { name: "Asphalt Shingles", category: "Roofing", unit: "bundle", cost: 38 },
  { name: "TPO Roofing Membrane", category: "Roofing", unit: "roll", cost: 310 },
  { name: "Safety Helmets", category: "Safety Gear", unit: "box", cost: 180 },
  { name: "Safety Harness Kit", category: "Safety Gear", unit: "unit", cost: 95 },
  { name: "High-Vis Vests", category: "Safety Gear", unit: "box", cost: 140 },
  { name: "Portable Fire Extinguisher", category: "Safety Gear", unit: "unit", cost: 65 },
  { name: "HVAC Ductwork 10in", category: "HVAC", unit: "length", cost: 46 },
];

const EQUIPMENT_CATALOG: { name: string; type: EquipmentType }[] = [
  { name: "CAT 320 Excavator", type: "Excavator" },
  { name: "Komatsu PC210 Excavator", type: "Excavator" },
  { name: "Liebherr LTM Mobile Crane", type: "Crane" },
  { name: "Tower Crane TC-6015", type: "Crane" },
  { name: "Volvo FMX Dump Truck", type: "Dump Truck" },
  { name: "Mack Granite Dump Truck", type: "Dump Truck" },
  { name: "CIFA Concrete Mixer Truck", type: "Concrete Mixer" },
  { name: "Portable Concrete Mixer 9cf", type: "Concrete Mixer" },
  { name: "Generac 100kW Generator", type: "Generator" },
  { name: "Cummins 60kW Generator", type: "Generator" },
  { name: "CAT D6 Bulldozer", type: "Bulldozer" },
  { name: "Komatsu D51 Bulldozer", type: "Bulldozer" },
  { name: "Toyota 8FGU Forklift", type: "Forklift" },
  { name: "Hyster H155 Forklift", type: "Forklift" },
  { name: "Atlas Copco Air Compressor", type: "Compressor" },
];

function rand<T>(arr: readonly T[]): T {
  return faker.helpers.arrayElement(arr as T[]);
}

function randMany<T>(arr: readonly T[], count: number): T[] {
  return faker.helpers.arrayElements(arr as T[], count);
}

function id(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

function pad(n: number, w = 4) {
  return String(n).padStart(w, "0");
}

export interface Store {
  projects: Project[];
  employees: Employee[];
  teams: Team[];
  tasks: Task[];
  clients: Client[];
  invoices: Invoice[];
  contracts: Contract[];
  subcontractors: Subcontractor[];
  equipment: Equipment[];
  materials: Material[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  documents: DocumentItem[];
  notifications: AppNotification[];
}

export function generateStore(seed = 1337): Store {
  faker.seed(seed);

  // ---------- Clients ----------
  const industries = [
    "Real Estate Development",
    "Retail",
    "Healthcare",
    "Government",
    "Education",
    "Hospitality",
    "Manufacturing",
    "Residential Development",
    "Municipal",
    "Technology",
  ];

  const clients: Client[] = Array.from({ length: COUNTS.clients }, (_, i) => {
    const company = faker.company.name();
    const city = faker.location.city();
    const state = faker.location.state({ abbreviated: true });
    const numContacts = faker.number.int({ min: 1, max: 3 });
    const contacts = Array.from({ length: numContacts }, (__, ci) => ({
      id: `${id("CT", i + 1)}-C${ci}`,
      name: faker.person.fullName(),
      title: rand(["Owner", "Operations Director", "Facilities Manager", "VP Development", "Procurement Lead"]),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number({ style: "national" }),
    }));
    const totalProjects = faker.number.int({ min: 1, max: 6 });
    const totalInvoiced = faker.number.int({ min: 40000, max: 4200000 });
    const outstandingBalance = faker.datatype.boolean({ probability: 0.35 })
      ? faker.number.int({ min: 5000, max: Math.round(totalInvoiced * 0.25) })
      : 0;
    return {
      id: id("CT", i + 1),
      company,
      industry: rand(industries),
      contacts,
      address: faker.location.streetAddress(),
      city,
      state,
      status: rand<Client["status"]>(["Active", "Active", "Active", "Past", "Lead"]),
      since: faker.date.past({ years: 6 }).toISOString(),
      totalProjects,
      totalInvoiced,
      outstandingBalance,
      communications: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, (___, mi) => ({
        id: `${id("CT", i + 1)}-M${mi}`,
        date: faker.date.recent({ days: 90 }).toISOString(),
        channel: rand(["Email", "Phone Call", "Meeting", "WhatsApp"]),
        note: rand([
          "Discussed change order request",
          "Reviewed monthly progress report",
          "Site walkthrough scheduled",
          "Sent updated invoice",
          "Contract renewal discussion",
          "Followed up on outstanding balance",
        ]),
      })),
    };
  });

  // ---------- Employees ----------
  const allRoles = [...CONSTRUCTION_ROLES, ...OFFICE_ROLES];
  const employees: Employee[] = Array.from({ length: COUNTS.employees }, (_, i) => {
    const role = rand(allRoles);
    const department = DEPARTMENTS_BY_ROLE[role] ?? "Construction";
    const name = faker.person.fullName();
    const performanceScore = faker.number.int({ min: 62, max: 99 });
    const vacationTotal = 20;
    return {
      id: id("EMP", i + 1),
      name,
      role,
      department,
      permission:
        role === "Project Manager" || role === "Site Superintendent" || department === "Management"
          ? rand<Employee["permission"]>(["Admin", "Manager"])
          : rand<Employee["permission"]>(["Manager", "Employee", "Employee", "Employee"]),
      email: faker.internet.email({ firstName: name.split(" ")[0], lastName: name.split(" ")[1] ?? "team" }).toLowerCase(),
      phone: faker.phone.number({ style: "national" }),
      hireDate: faker.date.past({ years: 8 }).toISOString(),
      employmentType: rand<Employee["employmentType"]>(["Full-time", "Full-time", "Full-time", "Contract", "Part-time"]),
      status: rand<Employee["status"]>(["Active", "Active", "Active", "Active", "On Leave", "Vacation"]),
      vacationUsed: faker.number.int({ min: 0, max: vacationTotal }),
      vacationTotal,
      weeklyHours: faker.number.int({ min: 32, max: 48 }),
      payrollStatus: rand<Employee["payrollStatus"]>(["Paid", "Paid", "Paid", "Pending", "Processing"]),
      performanceScore,
      avatarSeed: `${i}-${name}`,
      certifications: randMany(CERTIFICATIONS, faker.number.int({ min: 0, max: 4 })),
      city: faker.location.city(),
    };
  });

  const constructionEmployees = employees.filter((e) => e.department === "Construction");

  // ---------- Teams ----------
  const CREW_CALLSIGNS = [
    "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India",
    "Juliet", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
  ];
  const availableForemen = [...constructionEmployees];
  function pickUniqueForeman() {
    const idx = faker.number.int({ min: 0, max: availableForemen.length - 1 });
    const [chosen] = availableForemen.splice(idx, 1);
    chosen.role = "Site Foreman";
    chosen.permission = chosen.permission === "Employee" ? "Manager" : chosen.permission;
    return chosen;
  }

  const teams: Team[] = Array.from({ length: COUNTS.teams }, (_, i) => {
    const specialty = TEAM_SPECIALTIES[i % TEAM_SPECIALTIES.length];
    const foreman = pickUniqueForeman();
    const memberPool = constructionEmployees.filter((e) => e.id !== foreman.id);
    const memberIds = randMany(
      memberPool,
      faker.number.int({ min: 4, max: 9 })
    ).map((e) => e.id);
    return {
      id: id("TEAM", i + 1),
      name: `Crew ${CREW_CALLSIGNS[i % CREW_CALLSIGNS.length]} — ${specialty}`,
      specialty,
      foremanId: foreman.id,
      memberIds,
      currentProjectId: null,
      completedProjects: faker.number.int({ min: 3, max: 40 }),
      avgWeeklyHours: faker.number.int({ min: 36, max: 46 }),
      performanceScore: faker.number.int({ min: 68, max: 98 }),
      safetyIncidents: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, (__, si) => ({
        id: `${id("TEAM", i + 1)}-INC${si}`,
        date: faker.date.past({ years: 2 }).toISOString(),
        description: rand([
          "Minor slip on wet surface",
          "Improper PPE usage flagged",
          "Equipment near-miss incident",
          "Minor laceration during framing",
          "Heat exposure — worker rested and rehydrated",
        ]),
        severity: rand<"Minor" | "Moderate" | "Severe">(["Minor", "Minor", "Moderate", "Severe"]),
      })),
      certifications: randMany(CERTIFICATIONS, faker.number.int({ min: 1, max: 3 })),
      status: rand<Team["status"]>(["On Site", "On Site", "Available", "Off Duty"]),
    };
  });

  // assign team members' teamId
  teams.forEach((team) => {
    team.memberIds.forEach((mid) => {
      const emp = employees.find((e) => e.id === mid);
      if (emp) emp.teamId = team.id;
    });
    const foreman = employees.find((e) => e.id === team.foremanId);
    if (foreman) foreman.teamId = team.id;
  });

  // ---------- Projects ----------
  const pmPool = employees.filter((e) => e.role === "Project Manager" || e.role === "Site Superintendent");
  const projects: Project[] = Array.from({ length: COUNTS.projects }, (_, i) => {
    const type = PROJECT_TYPES[i % PROJECT_TYPES.length];
    const client = rand(clients);
    const budget = faker.number.int({ min: 150000, max: 8500000 });
    const startDate = faker.date.past({ years: 2 });
    const durationDays = faker.number.int({ min: 60, max: 540 });
    const deadline = new Date(startDate.getTime() + durationDays * 86400000);
    const now = new Date("2026-08-07");
    const totalSpan = deadline.getTime() - startDate.getTime();
    const elapsed = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalSpan);
    let progress = Math.round((elapsed / totalSpan) * 100);
    const isCompleted = deadline < now && faker.datatype.boolean({ probability: 0.7 });
    let status: ProjectStatus;
    const behind = faker.datatype.boolean({ probability: 0.22 });
    if (isCompleted) {
      status = "Completed";
      progress = 100;
    } else if (startDate > now) {
      status = "Planning";
      progress = 0;
    } else if (faker.datatype.boolean({ probability: 0.06 })) {
      status = "On Hold";
    } else if (behind) {
      status = "Behind Schedule";
      progress = Math.max(5, progress - faker.number.int({ min: 10, max: 30 }));
    } else {
      status = "In Progress";
    }
    progress = Math.min(100, Math.max(0, progress));

    const riskLevel: Project["riskLevel"] =
      status === "Behind Schedule"
        ? rand<"Medium" | "High">(["Medium", "High"])
        : status === "On Hold"
        ? "High"
        : rand<Project["riskLevel"]>(["Low", "Low", "Low", "Medium", "Medium", "High"]);

    const spentRatio =
      status === "Completed"
        ? faker.number.float({ min: 0.82, max: 1.08, fractionDigits: 2 })
        : faker.number.float({ min: 0.15, max: 1.05, fractionDigits: 2 }) * (progress / 100 + 0.15);
    const spent = Math.min(budget * 1.25, Math.round(budget * Math.max(0.05, spentRatio)));
    const invoicedToDate = Math.round(spent * faker.number.float({ min: 0.75, max: 1.05, fractionDigits: 2 }));

    const projectTeams = randMany(teams, faker.number.int({ min: 1, max: 3 }));
    const pm = rand(pmPool.length ? pmPool : employees);

    const city = faker.location.city();
    const state = faker.location.state({ abbreviated: true });

    const milestoneNames = ["Site Preparation", "Foundation", "Structural Framing", "MEP Rough-In", "Exterior Envelope", "Interior Finishing", "Final Inspection", "Handover"];
    const milestones = milestoneNames.map((label, mi) => {
      const mDate = new Date(startDate.getTime() + (totalSpan / milestoneNames.length) * (mi + 1));
      return {
        id: `${id("PRJ", i + 1)}-MS${mi}`,
        label,
        date: mDate.toISOString(),
        done: mDate < now && status !== "Planning",
      };
    });

    const comments = Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, (__, ci) => ({
      id: `${id("PRJ", i + 1)}-CM${ci}`,
      authorId: rand(employees).id,
      authorName: rand(employees).name,
      body: rand([
        "Client requested minor layout change on second floor.",
        "Weather delayed pour by two days, schedule adjusted.",
        "Material delivery confirmed for next Monday.",
        "Safety walkthrough completed, no issues found.",
        "Budget variance under review with finance team.",
        "Subcontractor confirmed start date for electrical rough-in.",
        "Inspection passed, moving to next milestone.",
        "Client walkthrough scheduled for next week.",
      ]),
      date: faker.date.recent({ days: 60 }).toISOString(),
    }));

    const activity: ActivityItemLike[] = Array.from({ length: faker.number.int({ min: 4, max: 10 }) }, (__, ai) => ({
      id: `${id("PRJ", i + 1)}-AC${ai}`,
      actor: rand(employees).name,
      action: rand([
        "updated the project timeline",
        "uploaded new site photos",
        "marked a milestone as complete",
        "added an expense entry",
        "logged a safety inspection",
        "uploaded a signed change order",
        "added a comment",
        "updated the budget forecast",
      ]),
      date: faker.date.recent({ days: 45 }).toISOString(),
    }));

    return {
      id: id("PRJ", i + 1),
      name: `${client.company.split(" ")[0]} ${type.prefix} ${faker.helpers.arrayElement(["I", "II", "Phase 1", "Phase 2", ""]).trim()}`.trim(),
      category: type.category,
      clientId: client.id,
      address: faker.location.streetAddress(),
      city,
      state,
      status,
      riskLevel,
      budget,
      spent,
      invoicedToDate,
      startDate: startDate.toISOString(),
      deadline: deadline.toISOString(),
      progress,
      teamIds: projectTeams.map((t) => t.id),
      projectManagerId: pm.id,
      photos: Array.from({ length: faker.number.int({ min: 4, max: 9 }) }, (__, pi) => `https://picsum.photos/seed/${id("PRJ", i + 1)}-${pi}/640/420`),
      filesCount: faker.number.int({ min: 8, max: 64 }),
      milestones,
      comments,
      activity,
      description: faker.lorem.paragraph({ min: 2, max: 4 }),
    };
  });

  interface ActivityItemLike {
    id: string;
    actor: string;
    action: string;
    date: string;
  }

  // assign currentProjectId to teams based on projects in progress
  projects.forEach((p) => {
    if (p.status === "In Progress" || p.status === "Behind Schedule") {
      p.teamIds.forEach((tid) => {
        const t = teams.find((tt) => tt.id === tid);
        if (t && !t.currentProjectId) t.currentProjectId = p.id;
      });
    }
  });

  // ---------- Tasks ----------
  const tasks: Task[] = Array.from({ length: COUNTS.tasks }, (_, i) => {
    const project = rand(projects);
    const loc = rand(LOCATIONS);
    const status = rand<TaskStatus>(["To Do", "To Do", "In Progress", "In Progress", "Blocked", "Completed", "Completed", "Completed"]);
    const dueDate = faker.date.between({ from: "2026-06-01", to: "2026-10-30" });
    const teamForProject = teams.filter((t) => project.teamIds.includes(t.id));
    const pool = teamForProject.length
      ? teamForProject.flatMap((t) => employees.filter((e) => e.teamId === t.id))
      : constructionEmployees;
    const assignees = randMany(pool.length ? pool : employees, faker.number.int({ min: 1, max: 3 }));
    return {
      id: id("TSK", i + 1),
      title: `${rand(TASK_VERBS)} ${project.name} (${loc.area})`,
      description: faker.lorem.sentence({ min: 8, max: 18 }),
      projectId: project.id,
      status,
      priority: rand<TaskPriority>(["Low", "Medium", "Medium", "High", "Urgent"]),
      assigneeIds: assignees.map((a) => a.id),
      dueDate: dueDate.toISOString(),
      createdDate: faker.date.recent({ days: 120 }).toISOString(),
      attachments: faker.number.int({ min: 0, max: 6 }),
      comments: faker.number.int({ min: 0, max: 9 }),
      tags: randMany([loc.area, loc.floor, project.category, "Priority", "Client-Facing", "Inspection"], faker.number.int({ min: 1, max: 3 })),
    };
  });

  // ---------- Invoices ----------
  const invoices: Invoice[] = Array.from({ length: COUNTS.invoices }, (_, i) => {
    const project = rand(projects);
    const issueDate = faker.date.recent({ days: 200 });
    const dueDate = new Date(issueDate.getTime() + 30 * 86400000);
    const now = new Date("2026-08-07");
    let status: Invoice["status"];
    let paidDate: string | null = null;
    if (faker.datatype.boolean({ probability: 0.55 })) {
      status = "Paid";
      paidDate = faker.date.between({ from: issueDate, to: new Date(Math.min(dueDate.getTime() + 15 * 86400000, now.getTime())) }).toISOString();
    } else if (dueDate < now) {
      status = "Overdue";
    } else if (faker.datatype.boolean({ probability: 0.15 })) {
      status = "Draft";
    } else {
      status = "Pending";
    }
    return {
      id: id("INV", i + 1),
      number: `INV-2026-${pad(i + 1, 4)}`,
      projectId: project.id,
      clientId: project.clientId,
      amount: faker.number.int({ min: 8000, max: 420000 }),
      status,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      paidDate,
    };
  });

  // ---------- Contracts ----------
  const contracts: Contract[] = Array.from({ length: COUNTS.contracts }, (_, i) => {
    const project = rand(projects);
    return {
      id: id("CTR", i + 1),
      projectId: project.id,
      clientId: project.clientId,
      title: `${rand(["Master Services Agreement", "Construction Contract", "Change Order", "Subcontract Agreement", "Design-Build Agreement"])} — ${project.name}`,
      type: rand<Contract["type"]>(["Fixed Price", "Time & Materials", "Cost Plus"]),
      value: faker.number.int({ min: 50000, max: 6000000 }),
      signedDate: faker.date.past({ years: 2 }).toISOString(),
      status: rand<Contract["status"]>(["Signed", "Signed", "Signed", "Pending", "Expired"]),
    };
  });

  // Reconcile client aggregate stats with the projects/invoices actually linked to them,
  // so "Total Projects" / "Total Invoiced" / "Outstanding" never contradict the client's real records.
  clients.forEach((client) => {
    const clientProjects = projects.filter((p) => p.clientId === client.id);
    const clientInvoices = invoices.filter((iv) => iv.clientId === client.id);
    client.totalProjects = clientProjects.length;
    client.totalInvoiced = clientInvoices.reduce((sum, iv) => sum + iv.amount, 0);
    client.outstandingBalance = clientInvoices
      .filter((iv) => iv.status === "Overdue" || iv.status === "Pending")
      .reduce((sum, iv) => sum + iv.amount, 0);
    if (clientProjects.length > 0 && client.status === "Lead") client.status = "Active";
  });

  // ---------- Subcontractors ----------
  const trades: SubTrade[] = ["Electrical", "Roofing", "Concrete", "Painting", "Excavation", "Plumbing", "HVAC"];
  const subcontractors: Subcontractor[] = Array.from({ length: COUNTS.subcontractors }, (_, i) => {
    const activeProjects = randMany(projects, faker.number.int({ min: 0, max: 3 }));
    return {
      id: id("SUB", i + 1),
      company: `${faker.company.name()} ${rand(["Contractors", "Services", "Group", "Solutions", "LLC"])}`,
      trade: trades[i % trades.length],
      contactName: faker.person.fullName(),
      phone: faker.phone.number({ style: "national" }),
      email: faker.internet.email().toLowerCase(),
      rating: faker.number.float({ min: 3.2, max: 5, fractionDigits: 1 }),
      jobsCompleted: faker.number.int({ min: 2, max: 65 }),
      activeProjectIds: activeProjects.map((p) => p.id),
      totalInvoiced: faker.number.int({ min: 15000, max: 950000 }),
      status: rand<Subcontractor["status"]>(["Active", "Active", "Active", "Inactive"]),
    };
  });

  // ---------- Equipment ----------
  const equipment: Equipment[] = Array.from({ length: COUNTS.equipment }, (_, i) => {
    const cat = EQUIPMENT_CATALOG[i % EQUIPMENT_CATALOG.length];
    const status = rand<Equipment["status"]>(["Available", "In Use", "In Use", "Maintenance"]);
    const project = status === "In Use" ? rand(projects) : null;
    return {
      id: id("EQP", i + 1),
      name: `${cat.name} #${pad(i + 1, 3)}`,
      type: cat.type,
      status,
      currentProjectId: project?.id ?? null,
      location: project ? `${project.city}, ${project.state} — Site` : "Main Equipment Yard",
      lastMaintenance: faker.date.past({ years: 1 }).toISOString(),
      nextMaintenance: faker.date.soon({ days: 90 }).toISOString(),
      qrCode: `QR-EQP-${pad(i + 1, 5)}`,
      hoursUsed: faker.number.int({ min: 120, max: 9800 }),
      purchaseDate: faker.date.past({ years: 6 }).toISOString(),
    };
  });

  // ---------- Suppliers ----------
  const supplierCategories = ["Concrete & Aggregates", "Steel & Metal", "Lumber & Wood", "Electrical Supplies", "Plumbing Supplies", "Safety Equipment", "Finishing Materials", "HVAC Equipment"];
  const suppliers: Supplier[] = Array.from({ length: COUNTS.suppliers }, (_, i) => ({
    id: id("SUP", i + 1),
    name: `${faker.company.name()} ${rand(["Supply Co.", "Materials", "Distributors", "Wholesale"])}`,
    category: rand(supplierCategories),
    contact: faker.phone.number({ style: "national" }),
    rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    ordersCount: faker.number.int({ min: 5, max: 240 }),
  }));

  // ---------- Materials ----------
  const materials: Material[] = Array.from({ length: COUNTS.materials }, (_, i) => {
    const cat = MATERIAL_CATALOG[i % MATERIAL_CATALOG.length];
    const reorderLevel = faker.number.int({ min: 20, max: 200 });
    const quantity = faker.number.int({ min: 0, max: 800 });
    return {
      id: id("MAT", i + 1),
      name: `${cat.name} ${i >= MATERIAL_CATALOG.length ? `(Batch ${Math.floor(i / MATERIAL_CATALOG.length) + 1})` : ""}`.trim(),
      category: cat.category,
      sku: `SKU-${pad(i + 1, 5)}`,
      quantity,
      unit: cat.unit,
      reorderLevel,
      warehouseLocation: `Aisle ${faker.number.int({ min: 1, max: 12 })} - Bin ${faker.string.alpha({ length: 1, casing: "upper" })}${faker.number.int({ min: 1, max: 40 })}`,
      supplierId: rand(suppliers).id,
      unitCost: cat.cost,
      qrCode: `QR-MAT-${pad(i + 1, 5)}`,
    };
  });

  // ---------- Purchase Orders ----------
  const purchaseOrders: PurchaseOrder[] = Array.from({ length: COUNTS.purchaseOrders }, (_, i) => {
    const material = rand(materials);
    const quantity = faker.number.int({ min: 10, max: 400 });
    const orderDate = faker.date.recent({ days: 90 });
    return {
      id: id("PO", i + 1),
      supplierId: material.supplierId,
      materialId: material.id,
      quantity,
      total: Math.round(quantity * material.unitCost),
      status: rand<PurchaseOrder["status"]>(["Ordered", "Shipped", "Delivered", "Delivered", "Pending"]),
      orderDate: orderDate.toISOString(),
      expectedDate: new Date(orderDate.getTime() + faker.number.int({ min: 3, max: 21 }) * 86400000).toISOString(),
    };
  });

  // ---------- Documents ----------
  const docCategories: DocumentItem["category"][] = ["Contract", "Blueprint", "Drawing", "PDF", "Inspection Report", "Safety Document", "Photo", "Signed Document"];
  const documents: DocumentItem[] = Array.from({ length: COUNTS.documents }, (_, i) => {
    const project = rand(projects);
    const category = docCategories[i % docCategories.length];
    const fileTypeMap: Record<string, string> = {
      Contract: "PDF",
      Blueprint: "DWG",
      Drawing: "DWG",
      PDF: "PDF",
      "Inspection Report": "PDF",
      "Safety Document": "PDF",
      Photo: "JPG",
      "Signed Document": "PDF",
    };
    return {
      id: id("DOC", i + 1),
      name: `${project.name} — ${category} ${pad((i % 40) + 1, 2)}`,
      category,
      projectId: project.id,
      uploadedBy: rand(employees).name,
      uploadDate: faker.date.recent({ days: 180 }).toISOString(),
      fileSize: `${faker.number.float({ min: 0.2, max: 48, fractionDigits: 1 })} MB`,
      fileType: fileTypeMap[category],
    };
  });

  // ---------- Notifications ----------
  const behindProjects = projects.filter((p) => p.status === "Behind Schedule");
  const overdueInvoices = invoices.filter((iv) => iv.status === "Overdue");
  const lowStockMaterials = materials.filter((m) => m.quantity < m.reorderLevel);
  const maintenanceEquipment = equipment.filter((e) => e.status === "Maintenance");
  const onLeaveEmployees = employees.filter((e) => e.status === "On Leave" || e.status === "Vacation");

  const notifications: AppNotification[] = [];
  let nIdx = 0;
  behindProjects.slice(0, 10).forEach((p) => {
    notifications.push({
      id: id("NTF", ++nIdx),
      type: "Delayed Project",
      message: `${p.name} is behind schedule (${p.progress}% complete, deadline ${new Date(p.deadline).toLocaleDateString()}).`,
      timestamp: faker.date.recent({ days: 10 }).toISOString(),
      read: faker.datatype.boolean({ probability: 0.4 }),
      severity: "critical",
      link: `/projects/${p.id}`,
    });
  });
  overdueInvoices.slice(0, 10).forEach((iv) => {
    notifications.push({
      id: id("NTF", ++nIdx),
      type: "Overdue Invoice",
      message: `Invoice ${iv.number} for $${iv.amount.toLocaleString()} is overdue.`,
      timestamp: faker.date.recent({ days: 14 }).toISOString(),
      read: faker.datatype.boolean({ probability: 0.4 }),
      severity: "warning",
      link: `/finance`,
    });
  });
  maintenanceEquipment.slice(0, 6).forEach((e) => {
    notifications.push({
      id: id("NTF", ++nIdx),
      type: "Equipment Maintenance",
      message: `${e.name} is currently under maintenance.`,
      timestamp: faker.date.recent({ days: 7 }).toISOString(),
      read: faker.datatype.boolean({ probability: 0.5 }),
      severity: "info",
      link: `/equipment`,
    });
  });
  lowStockMaterials.slice(0, 6).forEach((m) => {
    notifications.push({
      id: id("NTF", ++nIdx),
      type: "Low Inventory",
      message: `${m.name} stock is low (${m.quantity} ${m.unit} remaining, reorder at ${m.reorderLevel}).`,
      timestamp: faker.date.recent({ days: 5 }).toISOString(),
      read: faker.datatype.boolean({ probability: 0.5 }),
      severity: "warning",
      link: `/warehouse`,
    });
  });
  onLeaveEmployees.slice(0, 4).forEach((e) => {
    notifications.push({
      id: id("NTF", ++nIdx),
      type: "Employee Absence",
      message: `${e.name} (${e.role}) is currently ${e.status.toLowerCase()}.`,
      timestamp: faker.date.recent({ days: 5 }).toISOString(),
      read: faker.datatype.boolean({ probability: 0.6 }),
      severity: "info",
      link: `/employees`,
    });
  });

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
    materials,
    suppliers,
    purchaseOrders,
    documents,
    notifications,
  };
}
