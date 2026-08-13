import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { updateEmployeeAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { EmployeeForm } from "@/components/modules/employee-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { employees, teams } = await getStore();
  const employee = employees.find((e) => e.id === id);
  if (!employee) notFound();

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href={`/employees/${id}`} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {employee.name}
        </Link>
        <PageHeader title="Edit Employee" subtitle={employee.name} />
      </div>

      <EmployeeForm
        action={updateEmployeeAction}
        employee={employee}
        teams={teams}
        cancelHref={`/employees/${id}`}
        submitLabel="Save Changes"
      />
    </div>
  );
}
