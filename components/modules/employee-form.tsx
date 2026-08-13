import Link from "next/link";
import type { Employee, Team } from "@/lib/data/types";
import {
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_PERMISSIONS,
  EMPLOYMENT_TYPES,
} from "@/lib/data/constants";
import { Card } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass } from "@/components/ui/form";

export function EmployeeForm({
  action,
  employee,
  teams,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  employee?: Employee;
  teams: Team[];
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {employee && <input type="hidden" name="employeeId" value={employee.id} />}

      <Card className="p-6 space-y-6">
        <FormSection title="Personal Details">
          <FormField label="Full Name" required>
            <input name="name" required defaultValue={employee?.name} className={inputClass} placeholder="Jane Cooper" />
          </FormField>
          <FormField label="Job Title" required>
            <input name="role" required defaultValue={employee?.role} className={inputClass} placeholder="Site Superintendent" />
          </FormField>
          <FormField label="Email">
            <input name="email" type="email" defaultValue={employee?.email} className={inputClass} placeholder="jane@opsynq.com" />
          </FormField>
          <FormField label="Phone">
            <input name="phone" defaultValue={employee?.phone} className={inputClass} placeholder="(555) 010-2233" />
          </FormField>
          <FormField label="City">
            <input name="city" defaultValue={employee?.city} className={inputClass} placeholder="Denver" />
          </FormField>
          <FormField label="Hire Date">
            <input type="date" name="hireDate" defaultValue={employee?.hireDate.slice(0, 10)} className={inputClass} />
          </FormField>
        </FormSection>

        <FormSection title="Employment">
          <FormField label="Department">
            <select name="department" defaultValue={employee?.department ?? "Construction"} className={selectClass}>
              {EMPLOYEE_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Employment Type">
            <select name="employmentType" defaultValue={employee?.employmentType ?? "Full-time"} className={selectClass}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select name="status" defaultValue={employee?.status ?? "Active"} className={selectClass}>
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Access Level" hint="Controls in-app permissions for this person">
            <select name="permission" defaultValue={employee?.permission ?? "Employee"} className={selectClass}>
              {EMPLOYEE_PERMISSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Crew / Team">
            <select name="teamId" defaultValue={employee?.teamId ?? ""} className={selectClass}>
              <option value="">— Unassigned —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Weekly Hours">
            <input type="number" name="weeklyHours" min={0} max={80} defaultValue={employee?.weeklyHours ?? 40} className={inputClass} />
          </FormField>
          <FormField label="Vacation Allowance (days)">
            <input type="number" name="vacationTotal" min={0} max={60} defaultValue={employee?.vacationTotal ?? 20} className={inputClass} />
          </FormField>
        </FormSection>
      </Card>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 transition-colors shadow-sm shadow-blue-600/20"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-[13px] font-medium text-ink-600 hover:bg-ink-50 border border-ink-200 rounded-lg px-4 py-2.5 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
