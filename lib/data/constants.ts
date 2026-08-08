import type { ProjectStatus, RiskLevel, TeamSpecialty, Client } from "./types";

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
