import type { ProjectStatus, RiskLevel, TeamSpecialty, Client, TaskStatus, TaskPriority, EquipmentType, Equipment } from "./types";

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
