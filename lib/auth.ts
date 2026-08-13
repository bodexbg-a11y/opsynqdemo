import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "./db";

export type Role = "Admin" | "ProjectManager";

const SESSION_COOKIE = "opsynq_session";
const SESSION_DAYS = 30;

// scrypt is built into Node — no extra dependency needed for password hashing.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId: string | null;
  title: string | null;
  phone: string | null;
  /** data: URL of the uploaded avatar, or null to fall back to initials. */
  avatarUrl: string | null;
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (sessionId) await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  jar.delete(SESSION_COOKIE);
}

// Cached per-request: layout + page + any action helpers all call this, and it should
// only hit the database once per request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
    employeeId: session.user.employeeId,
    title: session.user.title,
    phone: session.user.phone,
    avatarUrl: session.user.avatarUrl,
  };
});

/** Redirects to /login if not signed in, or to /projects if signed in but not an Admin. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/projects");
  return user;
}

/**
 * Same as requireAdmin, but also lets a signed-in ProjectManager through as long as the
 * given project is assigned to them — used by server actions a PM triggers from their own
 * project page (status changes, photo uploads, tasks) so a crafted request can't touch a
 * project that isn't theirs.
 */
export async function requireProjectAccess(projectId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "Admin") return user;

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { projectManagerId: true } });
  if (!project || project.projectManagerId !== user.employeeId) redirect("/projects");
  return user;
}
