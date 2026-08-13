export type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "On Hold"
  | "Behind Schedule"
  | "Completed";

export type RiskLevel = "Low" | "Medium" | "High";

export interface Milestone {
  id: string;
  label: string;
  date: string;
  done: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  date: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  date: string;
  icon?: string;
}

export interface Project {
  id: string;
  name: string;
  category: "Residential" | "Commercial" | "Infrastructure" | "Renovation" | "Industrial";
  clientId: string;
  address: string;
  city: string;
  state: string;
  status: ProjectStatus;
  riskLevel: RiskLevel;
  budget: number;
  spent: number;
  invoicedToDate: number;
  startDate: string;
  deadline: string;
  progress: number;
  teamIds: string[];
  projectManagerId: string;
  photos: string[];
  filesCount: number;
  milestones: Milestone[];
  comments: Comment[];
  activity: ActivityItem[];
  description: string;
}

export type EmployeeDepartment =
  | "Construction"
  | "Management"
  | "Finance"
  | "Human Resources"
  | "Safety"
  | "Design"
  | "Procurement";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: EmployeeDepartment;
  permission: "Admin" | "Manager" | "Employee";
  email: string;
  phone: string;
  hireDate: string;
  employmentType: "Full-time" | "Part-time" | "Contract";
  status: "Active" | "On Leave" | "Vacation";
  teamId?: string;
  vacationUsed: number;
  vacationTotal: number;
  weeklyHours: number;
  payrollStatus: "Paid" | "Pending" | "Processing";
  performanceScore: number;
  avatarSeed: string;
  certifications: string[];
  city: string;
}

export type TeamSpecialty =
  | "Framing"
  | "Concrete"
  | "Electrical"
  | "Plumbing"
  | "Roofing"
  | "Masonry"
  | "HVAC"
  | "Excavation"
  | "Finishing"
  | "General Labor";

export interface SafetyIncident {
  id: string;
  date: string;
  description: string;
  severity: "Minor" | "Moderate" | "Severe";
}

export interface Team {
  id: string;
  name: string;
  specialty: TeamSpecialty;
  foremanId: string;
  memberIds: string[];
  currentProjectId: string | null;
  completedProjects: number;
  avgWeeklyHours: number;
  performanceScore: number;
  safetyIncidents: SafetyIncident[];
  certifications: string[];
  status: "On Site" | "Available" | "Off Duty";
}

export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  dueDate: string;
  createdDate: string;
  attachments: number;
  comments: number;
  tags: string[];
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Client {
  id: string;
  company: string;
  industry: string;
  contacts: Contact[];
  address: string;
  city: string;
  state: string;
  status: "Active" | "Past" | "Lead";
  since: string;
  totalProjects: number;
  totalInvoiced: number;
  outstandingBalance: number;
  communications: { id: string; date: string; channel: string; note: string }[];
}

export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

export interface Invoice {
  id: string;
  number: string;
  projectId: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
}

export interface Contract {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  type: "Fixed Price" | "Time & Materials" | "Cost Plus";
  value: number;
  signedDate: string;
  status: "Signed" | "Pending" | "Expired";
}

export type SubTrade =
  | "Electrical"
  | "Roofing"
  | "Concrete"
  | "Painting"
  | "Excavation"
  | "Plumbing"
  | "HVAC";

export interface Subcontractor {
  id: string;
  company: string;
  trade: SubTrade;
  contactName: string;
  phone: string;
  email: string;
  rating: number;
  jobsCompleted: number;
  activeProjectIds: string[];
  totalInvoiced: number;
  status: "Active" | "Inactive";
}

export type EquipmentType =
  | "Excavator"
  | "Crane"
  | "Dump Truck"
  | "Concrete Mixer"
  | "Generator"
  | "Bulldozer"
  | "Forklift"
  | "Compressor";

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  status: "Available" | "In Use" | "Maintenance";
  currentProjectId: string | null;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  qrCode: string;
  hoursUsed: number;
  purchaseDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  rating: number;
  ordersCount: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  manager: string;
  /** Storage capacity in pallet positions. */
  capacity: number;
  notes: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  /** Bin/aisle within the warehouse, e.g. "Aisle 3 - Bin C2". */
  warehouseLocation: string;
  warehouseId: string | null;
  supplierId: string;
  unitCost: number;
  qrCode: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  materialId: string;
  quantity: number;
  total: number;
  status: "Ordered" | "Shipped" | "Delivered" | "Pending";
  orderDate: string;
  expectedDate: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category:
    | "Contract"
    | "Blueprint"
    | "Drawing"
    | "PDF"
    | "Inspection Report"
    | "Safety Document"
    | "Photo"
    | "Signed Document";
  projectId: string | null;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
}

export interface AppNotification {
  id: string;
  type:
    | "Delayed Project"
    | "Overdue Invoice"
    | "Equipment Maintenance"
    | "Low Inventory"
    | "Employee Absence"
    | "General";
  message: string;
  timestamp: string;
  read: boolean;
  severity: "info" | "warning" | "critical";
  link?: string;
}

export type AdPlatform = "Facebook" | "Google";
export type CampaignStatus = "Active" | "Paused" | "Ended" | "Draft";
export type CampaignObjective =
  | "Lead Generation"
  | "Brand Awareness"
  | "Website Traffic"
  | "Conversions"
  | "Local Reach";

export interface AdCampaign {
  id: string;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  projectId: string | null;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
  startDate: string;
  endDate: string | null;
}
