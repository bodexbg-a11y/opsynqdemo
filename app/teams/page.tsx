import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { TeamsGrid } from "@/components/modules/teams-grid";

export default function TeamsPage() {
  const { teams, employees, projects } = getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Construction Teams" subtitle={`${teams.length} crews · ${employees.filter((e) => e.teamId).length} field employees`} />
      <TeamsGrid teams={teams} employees={employees} projects={projects} />
    </div>
  );
}
