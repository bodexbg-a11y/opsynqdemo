"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getCurrentUser, requireAdmin, hashPassword, verifyPassword } from "./auth";
import { SETTINGS_ID, DEFAULT_SETTINGS, CURRENCIES, DATE_FORMATS, TIMEZONES, EMAIL_DIGESTS } from "./settings";
import { matchEnum, parseNumber } from "./data/import-helpers";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

/** Updates the signed-in user's own profile, including an optional avatar upload. */
export async function updateProfileAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!name || !email) redirect("/settings?error=invalid");

  // Email is the login identifier, so it has to stay unique across accounts.
  if (email !== current.email) {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken && taken.id !== current.id) redirect("/settings?error=email_taken");
  }

  let avatarUrl: string | undefined;
  if (formData.get("removeAvatar") === "on") {
    avatarUrl = "";
  } else {
    const file = formData.get("avatar");
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_AVATAR_TYPES.includes(file.type)) redirect("/settings?error=avatar_type");
      if (file.size > MAX_AVATAR_BYTES) redirect("/settings?error=avatar_size");
      const buffer = Buffer.from(await file.arrayBuffer());
      avatarUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }
  }

  await prisma.user.update({
    where: { id: current.id },
    data: {
      name,
      email,
      title: String(formData.get("title") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      // "" is the explicit remove signal; undefined leaves the current avatar alone.
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect("/settings?saved=profile");
}

export async function changePasswordAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) redirect("/settings?error=password_short");
  if (newPassword !== confirmPassword) redirect("/settings?error=password_mismatch");

  const record = await prisma.user.findUnique({ where: { id: current.id }, select: { passwordHash: true } });
  if (!record || !verifyPassword(currentPassword, record.passwordHash)) {
    redirect("/settings?error=password_wrong");
  }

  await prisma.user.update({ where: { id: current.id }, data: { passwordHash: hashPassword(newPassword) } });
  redirect("/settings?saved=password");
}

/** Admin-only: workspace-wide company profile, notification and threshold settings. */
export async function updateAppSettingsAction(formData: FormData) {
  await requireAdmin();

  const data = {
    companyName: String(formData.get("companyName") || "").trim() || DEFAULT_SETTINGS.companyName,
    headquarters: String(formData.get("headquarters") || "").trim(),
    industry: String(formData.get("industry") || "").trim(),
    plan: String(formData.get("plan") || "").trim() || DEFAULT_SETTINGS.plan,
    currency: matchEnum(String(formData.get("currency") || ""), CURRENCIES, DEFAULT_SETTINGS.currency as "USD"),
    dateFormat: matchEnum(String(formData.get("dateFormat") || ""), DATE_FORMATS, DEFAULT_SETTINGS.dateFormat as "MMM d, yyyy"),
    timezone: matchEnum(String(formData.get("timezone") || ""), TIMEZONES, DEFAULT_SETTINGS.timezone as "America/Denver"),
    notifyDelayedProjects: checked(formData, "notifyDelayedProjects"),
    notifyOverdueInvoices: checked(formData, "notifyOverdueInvoices"),
    notifyEquipmentMaintenance: checked(formData, "notifyEquipmentMaintenance"),
    notifyLowInventory: checked(formData, "notifyLowInventory"),
    notifyEmployeeAbsence: checked(formData, "notifyEmployeeAbsence"),
    emailDigest: matchEnum(String(formData.get("emailDigest") || ""), EMAIL_DIGESTS, "Weekly"),
    lowStockBufferPct: Math.min(100, Math.max(0, parseNumber(String(formData.get("lowStockBufferPct") || ""), 0))),
    budgetWarningPct: Math.min(100, Math.max(1, parseNumber(String(formData.get("budgetWarningPct") || ""), 85))),
    deadlineWarningDays: Math.min(180, Math.max(1, parseNumber(String(formData.get("deadlineWarningDays") || ""), 14))),
  };

  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  // Tabs are URL-driven, so carry the originating tab through the redirect —
  // otherwise saving from Notifications bounces the user back to My Profile.
  const tab = String(formData.get("tab") || "").trim();
  redirect(`/settings?saved=workspace${tab ? `&tab=${encodeURIComponent(tab)}` : ""}`);
}
