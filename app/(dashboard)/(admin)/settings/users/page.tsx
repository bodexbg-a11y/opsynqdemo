import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { createUserAction, deleteUserAction } from "@/lib/actions-auth";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FormField, inputClass, selectClass } from "@/components/ui/form";
import { ConfirmDeleteForm } from "@/components/modules/confirm-delete-form";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const { error, created } = await searchParams;
  const current = await getCurrentUser();
  const [users, { employees }] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getStore(),
  ]);

  const employeeName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? null;

  return (
    <div className="space-y-5 pb-10 max-w-4xl">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Link>
        <PageHeader title="User Accounts" subtitle="Create logins and control who can access the platform" />
      </div>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5 text-[12.5px] text-danger-700">
          {error === "exists" ? "A user with that email already exists." : error === "self" ? "You can't delete your own account." : "Please fill in all required fields (password must be at least 6 characters)."}
        </div>
      )}
      {created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[12.5px] text-emerald-700">
          User account created successfully.
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-[14px] font-semibold text-ink-900">Existing Accounts</h3>
        </div>
        <div className="divide-y divide-ink-50 mt-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={u.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink-900 truncate">{u.name}</p>
                <p className="text-[12px] text-ink-400 truncate">
                  {u.email}
                  {employeeName(u.employeeId) && <> · linked to {employeeName(u.employeeId)}</>}
                </p>
              </div>
              <Badge variant={u.role === "Admin" ? "blue" : "neutral"}>{u.role === "Admin" ? "Admin" : "Project Manager"}</Badge>
              {u.id !== current?.id && (
                <ConfirmDeleteForm action={deleteUserAction} fields={{ userId: u.id }} confirmMessage={`Delete login for ${u.name}? This cannot be undone.`}>
                  <button type="submit" className="text-[12px] font-medium text-danger-600 hover:text-danger-700 px-2 py-1">
                    Delete
                  </button>
                </ConfirmDeleteForm>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[14px] font-semibold text-ink-900 mb-1">Create Account</h3>
        <p className="text-[12.5px] text-ink-500 mb-4">Admins have full access. Project Managers only see the projects and tasks assigned to their linked employee.</p>
        <form action={createUserAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <input name="name" required className={inputClass} placeholder="Jane Cooper" />
          </FormField>
          <FormField label="Email" required>
            <input name="email" type="email" required className={inputClass} placeholder="jane@opsynq.com" />
          </FormField>
          <FormField label="Password" required hint="At least 6 characters">
            <input name="password" type="password" required minLength={6} className={inputClass} />
          </FormField>
          <FormField label="Role" required>
            <select name="role" className={selectClass} defaultValue="ProjectManager">
              <option value="ProjectManager">Project Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </FormField>
          <FormField label="Linked Employee" hint="Required for Project Managers — controls which projects they see" className="md:col-span-2">
            <select name="employeeId" className={selectClass} defaultValue="">
              <option value="">— None —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.role}
                </option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors shadow-sm shadow-blue-600/20"
            >
              Create Account
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
