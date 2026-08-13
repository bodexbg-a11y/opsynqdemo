import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/card";
import { TasksWorkspace } from "@/components/modules/tasks-workspace";

export default async function TasksPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "Admin";
  const { tasks, employees, projects } = await getStore();

  const visibleProjects = isAdmin ? projects : projects.filter((p) => p.projectManagerId === user?.employeeId);
  const visibleProjectIds = new Set(visibleProjects.map((p) => p.id));
  const visibleTasks = isAdmin ? tasks : tasks.filter((t) => visibleProjectIds.has(t.projectId));

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Task Management"
        subtitle={
          isAdmin
            ? `${visibleTasks.length} tasks across all active job sites · filter by project, drag cards to update status`
            : `${visibleTasks.length} tasks across your assigned projects · drag cards to update status`
        }
      />
      <TasksWorkspace tasks={visibleTasks} employees={employees} projects={visibleProjects} canEdit />
    </div>
  );
}
