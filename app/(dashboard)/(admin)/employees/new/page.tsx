import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { createEmployeeAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { EmployeeForm } from "@/components/modules/employee-form";

export default async function NewEmployeePage() {
  const { teams } = await getStore();

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Employees
        </Link>
        <PageHeader title="New Employee" subtitle="Add a person to the company directory" />
      </div>

      <EmployeeForm action={createEmployeeAction} teams={teams} cancelHref="/employees" submitLabel="Add Employee" />
    </div>
  );
}
