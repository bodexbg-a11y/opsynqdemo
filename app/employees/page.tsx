import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { EmployeesTable } from "@/components/modules/employees-table";

export default function EmployeesPage() {
  const { employees, teams } = getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Employees" subtitle={`${employees.length} people across the company`} />
      <EmployeesTable employees={employees} teams={teams} />
    </div>
  );
}
