import { cn } from "@/lib/utils";
import type {
  ProjectStatus,
  RiskLevel,
  TaskPriority,
  TaskStatus,
  InvoiceStatus,
} from "@/lib/data/types";

export function Badge({
  children,
  className,
  variant = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "neutral" | "blue" | "success" | "warning" | "danger" | "navy";
}) {
  const variants: Record<string, string> = {
    neutral: "bg-ink-100 text-ink-600",
    blue: "bg-blue-50 text-blue-700",
    success: "bg-success-100 text-success-500",
    warning: "bg-warning-100 text-warning-500",
    danger: "bg-danger-100 text-danger-500",
    navy: "bg-navy-800 text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const projectStatusVariant: Record<ProjectStatus, Parameters<typeof Badge>[0]["variant"]> = {
  Planning: "neutral",
  "In Progress": "blue",
  "On Hold": "warning",
  "Behind Schedule": "danger",
  Completed: "success",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={projectStatusVariant[status]}>{status}</Badge>;
}

const riskVariant: Record<RiskLevel, Parameters<typeof Badge>[0]["variant"]> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <Badge variant={riskVariant[risk]}>{risk} Risk</Badge>;
}

const priorityVariant: Record<TaskPriority, Parameters<typeof Badge>[0]["variant"]> = {
  Low: "neutral",
  Medium: "blue",
  High: "warning",
  Urgent: "danger",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={priorityVariant[priority]}>{priority}</Badge>;
}

const taskStatusVariant: Record<TaskStatus, Parameters<typeof Badge>[0]["variant"]> = {
  "To Do": "neutral",
  "In Progress": "blue",
  Blocked: "danger",
  Completed: "success",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={taskStatusVariant[status]}>{status}</Badge>;
}

const invoiceStatusVariant: Record<InvoiceStatus, Parameters<typeof Badge>[0]["variant"]> = {
  Paid: "success",
  Pending: "blue",
  Overdue: "danger",
  Draft: "neutral",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={invoiceStatusVariant[status]}>{status}</Badge>;
}
