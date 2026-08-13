"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Employee, Team } from "@/lib/data/types";
import {
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  EMPLOYEE_PERMISSIONS,
} from "@/lib/data/constants";
import { deleteEmployeeAction } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  SearchInput,
  FilterSelect,
  FilterSelectPairs,
  FilterPills,
  ClearFiltersButton,
  SortHeader,
  nextSort,
  compareValues,
} from "@/components/ui/filter-bar";
import { ConfirmDeleteForm } from "./confirm-delete-form";

const DEPARTMENT_PILLS = ["All", ...EMPLOYEE_DEPARTMENTS] as const;
type DeptPill = (typeof DEPARTMENT_PILLS)[number];

const STATUS_TONE: Record<Employee["status"], "success" | "warning" | "neutral"> = {
  Active: "success",
  "On Leave": "warning",
  Vacation: "neutral",
};

const PAYROLL_TONE: Record<Employee["payrollStatus"], "success" | "warning" | "neutral"> = {
  Paid: "success",
  Pending: "warning",
  Processing: "neutral",
};

type SortKey = "name" | "department" | "team" | "status" | "performance" | "hireDate";

export function EmployeesTable({ employees, teams }: { employees: Employee[]; teams: Team[] }) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<DeptPill>("All");
  const [status, setStatus] = useState<Employee["status"] | "All">("All");
  const [employmentType, setEmploymentType] = useState<Employee["employmentType"] | "All">("All");
  const [permission, setPermission] = useState<Employee["permission"] | "All">("All");
  const [teamId, setTeamId] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({ key: null, dir: "asc" });

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const teamOptions = useMemo(
    () =>
      [...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ value: t.id, label: t.name })),
    [teams]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = employees.filter((e) => {
      if (dept !== "All" && e.department !== dept) return false;
      if (status !== "All" && e.status !== status) return false;
      if (employmentType !== "All" && e.employmentType !== employmentType) return false;
      if (permission !== "All" && e.permission !== permission) return false;
      if (teamId !== "All" && e.teamId !== teamId) return false;
      if (q && !`${e.name} ${e.role} ${e.email} ${e.city}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (!sort.key) return rows;
    const key = sort.key;
    const sorted = [...rows].sort((a, b) => {
      switch (key) {
        case "name":
          return compareValues(a.name, b.name);
        case "department":
          return compareValues(a.department, b.department);
        case "team":
          return compareValues(teamMap.get(a.teamId ?? "")?.name, teamMap.get(b.teamId ?? "")?.name);
        case "status":
          return compareValues(a.status, b.status);
        case "performance":
          return a.performanceScore - b.performanceScore;
        case "hireDate":
          return new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
        default:
          return 0;
      }
    });
    return sort.dir === "asc" ? sorted : sorted.reverse();
  }, [employees, dept, status, employmentType, permission, teamId, query, sort, teamMap]);

  const hasFilters =
    dept !== "All" || status !== "All" || employmentType !== "All" || permission !== "All" || teamId !== "All" || query !== "";

  const clearAll = () => {
    setDept("All");
    setStatus("All");
    setEmploymentType("All");
    setPermission("All");
    setTeamId("All");
    setQuery("");
  };

  const onSort = (c: SortKey) => setSort((s) => nextSort(s, c));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills value={dept} options={DEPARTMENT_PILLS} onChange={setDept} />
        <SearchInput value={query} onChange={setQuery} placeholder="Search employees…" className="w-56" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Status" value={status} options={EMPLOYEE_STATUSES} onChange={setStatus} allLabel="Any status" />
        <FilterSelect
          label="Employment type"
          value={employmentType}
          options={EMPLOYMENT_TYPES}
          onChange={setEmploymentType}
          allLabel="Any contract"
        />
        <FilterSelect label="Access level" value={permission} options={EMPLOYEE_PERMISSIONS} onChange={setPermission} allLabel="Any access" />
        <FilterSelectPairs label="Team" value={teamId} options={teamOptions} onChange={setTeamId} allLabel="Any team" />
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />
        <span className="ml-auto text-[12px] text-ink-400">
          {filtered.length} of {employees.length} people
        </span>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <SortHeader column="name" label="Employee" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} className="px-5" />
                <SortHeader column="department" label="Department" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="team" label="Team" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="status" label="Status" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <th className="px-4 py-3 font-medium">Vacation</th>
                <th className="px-4 py-3 font-medium">Payroll</th>
                <SortHeader column="performance" label="Performance" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 150).map((e) => (
                <tr key={e.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                  <td className="px-5 py-2.5">
                    <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                      <Avatar name={e.name} size={28} />
                      <div>
                        <p className="font-medium text-ink-800 hover:text-blue-600">{e.name}</p>
                        <p className="text-ink-400 text-[11px]">{e.role}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-600 whitespace-nowrap">{e.department}</td>
                  <td className="px-4 py-2.5 text-ink-500 whitespace-nowrap">
                    {e.teamId ? teamMap.get(e.teamId)?.name.replace(/^Crew /, "") ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_TONE[e.status]}>{e.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-500 whitespace-nowrap">
                    {e.vacationUsed}/{e.vacationTotal} days
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={PAYROLL_TONE[e.payrollStatus]}>{e.payrollStatus}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-700 font-medium">{e.performanceScore}/100</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="neutral">{e.permission}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Link href={`/employees/${e.id}/edit`} className="text-ink-400 hover:text-blue-600 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <ConfirmDeleteForm
                        action={deleteEmployeeAction}
                        fields={{ employeeId: e.id }}
                        confirmMessage={`Remove ${e.name} from the directory? This cannot be undone.`}
                        className="flex"
                      >
                        <button type="submit" className="text-ink-400 hover:text-danger-500 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ConfirmDeleteForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No employees match your filters.</div>}
      </div>
    </div>
  );
}
