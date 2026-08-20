import type {
  ProjectStatus,
  RiskLevel,
  TeamSpecialty,
  Client,
  TaskStatus,
  TaskPriority,
  EquipmentType,
  Equipment,
  EmployeeDepartment,
  Employee,
  SubTrade,
  Subcontractor,
} from "./types";

export const TEAM_SPECIALTIES: TeamSpecialty[] = [
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

export const PROJECT_CATEGORIES = ["Residential", "Commercial", "Infrastructure", "Renovation", "Industrial"] as const;

export const PROJECT_STATUSES: ProjectStatus[] = ["Planning", "In Progress", "On Hold", "Behind Schedule", "Completed"];

export const RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High"];

export const TEAM_STATUSES = ["On Site", "Available", "Off Duty"] as const;

export const CLIENT_STATUSES: Client["status"][] = ["Active", "Past", "Lead"];

/** Pipeline stages for a lead captured from an ad form. */
export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Completed"];

export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

export const EQUIPMENT_TYPES: EquipmentType[] = [
  "Excavator",
  "Crane",
  "Dump Truck",
  "Concrete Mixer",
  "Generator",
  "Bulldozer",
  "Forklift",
  "Compressor",
];

export const EQUIPMENT_STATUSES: Equipment["status"][] = ["Available", "In Use", "Maintenance"];

export const EMPLOYEE_DEPARTMENTS: EmployeeDepartment[] = [
  "Construction",
  "Management",
  "Finance",
  "Human Resources",
  "Safety",
  "Design",
  "Procurement",
];

export const EMPLOYEE_STATUSES: Employee["status"][] = ["Active", "On Leave", "Vacation"];

export const EMPLOYMENT_TYPES: Employee["employmentType"][] = ["Full-time", "Part-time", "Contract"];

export const EMPLOYEE_PERMISSIONS: Employee["permission"][] = ["Admin", "Manager", "Employee"];

export const SUB_TRADES: SubTrade[] = ["Electrical", "Roofing", "Concrete", "Painting", "Excavation", "Plumbing", "HVAC"];

export const SUBCONTRACTOR_STATUSES: Subcontractor["status"][] = ["Active", "Inactive"];

export const MATERIAL_CATEGORIES = [
  "Concrete",
  "Steel",
  "Lumber",
  "Electrical",
  "Plumbing",
  "Finishing",
  "Roofing",
  "Safety Gear",
  "HVAC",
] as const;
