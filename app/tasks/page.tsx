import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { KanbanBoard } from "@/components/modules/kanban-board";

export default function TasksPage() {
  const { tasks, employees, projects } = getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Task Management" subtitle={`${tasks.length} tasks across all active job sites · drag cards to update status`} />
      <KanbanBoard tasks={tasks} employees={employees} projects={projects} />
    </div>
  );
}
