import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { EmployeesTable } from "@/components/modules/employees-table";

export default async function EmployeesPage() {
  const { employees, teams } = await getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Employees" subtitle={`${employees.length} people across the company`} />
      <EmployeesTable employees={employees} teams={teams} />
    </div>
  );
}
