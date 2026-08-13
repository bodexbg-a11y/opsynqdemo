"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentUser } from "./auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=1");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/** Admin-only: creates a login account for an employee (or a standalone admin). */
export async function createUserAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current || current.role !== "Admin") redirect("/");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") === "Admin" ? "Admin" : "ProjectManager";
  const employeeId = String(formData.get("employeeId") || "").trim() || null;

  if (!name || !email || password.length < 6) {
    redirect("/settings/users?error=invalid");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/settings/users?error=exists");

  if (employeeId) {
    const employeeExists = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
    if (!employeeExists) redirect("/settings/users?error=invalid");
  }

  await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password), role, employeeId },
  });

  revalidatePath("/settings/users");
  redirect("/settings/users?created=1");
}

export async function deleteUserAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current || current.role !== "Admin") redirect("/");

  const userId = String(formData.get("userId") || "");
  if (userId === current.id) redirect("/settings/users?error=self");

  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  revalidatePath("/settings/users");
  redirect("/settings/users");
}
