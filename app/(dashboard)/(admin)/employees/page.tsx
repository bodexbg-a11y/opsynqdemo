import Link from "next/link";
import { Plus, Upload, Download } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { EmployeesTable } from "@/components/modules/employees-table";

export default async function EmployeesPage() {
  const { employees, teams } = await getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} people across the company`}
        action={
          <div className="flex items-center gap-2">
            <a
              href="/api/export/employees"
              className="flex items-center gap-1.5 text-[13px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </a>
            <Link
              href="/import?type=employees"
              className="flex items-center gap-1.5 text-[13px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </Link>
            <Link
              href="/employees/new"
              className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              New Employee
            </Link>
          </div>
        }
      />
      <EmployeesTable employees={employees} teams={teams} />
    </div>
  );
}
