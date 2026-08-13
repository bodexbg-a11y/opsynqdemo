import "server-only";
import { cache } from "react";
import { prisma } from "./db";

export const SETTINGS_ID = "singleton";

export interface AppSettingsShape {
  companyName: string;
  headquarters: string;
  industry: string;
  plan: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  notifyDelayedProjects: boolean;
  notifyOverdueInvoices: boolean;
  notifyEquipmentMaintenance: boolean;
  notifyLowInventory: boolean;
  notifyEmployeeAbsence: boolean;
  emailDigest: string;
  lowStockBufferPct: number;
  budgetWarningPct: number;
  deadlineWarningDays: number;
}

/** Mirrors the schema defaults so the app renders before the row is first written. */
export const DEFAULT_SETTINGS: AppSettingsShape = {
  companyName: "OPSYNQ Builders Group",
  headquarters: "Denver, CO",
  industry: "General Contracting",
  plan: "Enterprise",
  currency: "USD",
  dateFormat: "MMM d, yyyy",
  timezone: "America/Denver",
  notifyDelayedProjects: true,
  notifyOverdueInvoices: true,
  notifyEquipmentMaintenance: true,
  notifyLowInventory: true,
  notifyEmployeeAbsence: false,
  emailDigest: "Weekly",
  lowStockBufferPct: 0,
  budgetWarningPct: 85,
  deadlineWarningDays: 14,
};

/**
 * Reads the workspace settings, falling back to defaults when the row doesn't
 * exist yet. Cached per request since the layout and page both read it.
 */
export const getAppSettings = cache(async (): Promise<AppSettingsShape> => {
  const row = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    // Select the settings fields explicitly so `id`/`updatedAt` never leak into
    // the shape callers spread back into forms.
    select: {
      companyName: true,
      headquarters: true,
      industry: true,
      plan: true,
      currency: true,
      dateFormat: true,
      timezone: true,
      notifyDelayedProjects: true,
      notifyOverdueInvoices: true,
      notifyEquipmentMaintenance: true,
      notifyLowInventory: true,
      notifyEmployeeAbsence: true,
      emailDigest: true,
      lowStockBufferPct: true,
      budgetWarningPct: true,
      deadlineWarningDays: true,
    },
  });
  return row ?? DEFAULT_SETTINGS;
});

/**
 * Applies the notification preferences to a feed. Alert types the workspace has
 * switched off are dropped everywhere they surface — bell menu, badge count and
 * the notifications page — so the toggles have a visible effect.
 */
export function filterNotificationsBySettings<T extends { type: string }>(
  notifications: T[],
  settings: AppSettingsShape
): T[] {
  const enabled: Record<string, boolean> = {
    "Delayed Project": settings.notifyDelayedProjects,
    "Overdue Invoice": settings.notifyOverdueInvoices,
    "Equipment Maintenance": settings.notifyEquipmentMaintenance,
    "Low Inventory": settings.notifyLowInventory,
    "Employee Absence": settings.notifyEmployeeAbsence,
  };
  // Unlisted types (e.g. "General") are always shown.
  return notifications.filter((n) => enabled[n.type] ?? true);
}

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
export const DATE_FORMATS = ["MMM d, yyyy", "d MMM yyyy", "MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd"] as const;
export const TIMEZONES = [
  "America/Denver",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "UTC",
] as const;
export const EMAIL_DIGESTS = ["Off", "Daily", "Weekly"] as const;
