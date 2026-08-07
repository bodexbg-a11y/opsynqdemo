"use client";

import { useMemo, useState } from "react";
import { Paperclip, MessageSquare, Search } from "lucide-react";
import type { Task, TaskStatus, Employee, Project } from "@/lib/data/types";
import { PriorityBadge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";

const COLUMNS: { status: TaskStatus; tone: string }[] = [
  { status: "To Do", tone: "bg-ink-300" },
  { status: "In Progress", tone: "bg-blue-500" },
  { status: "Blocked", tone: "bg-danger-500" },
  { status: "Completed", tone: "bg-success-500" },
];

const PER_COLUMN_LIMIT = 40;

export function KanbanBoard({ tasks, employees, projects }: { tasks: Task[]; employees: Employee[]; projects: Project[] }) {
  const [items, setItems] = useState(tasks);
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filtered = query
    ? items.filter((t) => `${t.title} ${projectMap.get(t.projectId)?.name ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    : items;

  function handleDrop(status: TaskStatus) {
    if (!dragId) return;
    setItems((prev) => prev.map((t) => (t.id === dragId ? { ...t, status } : t)));
    setDragId(null);
  }

  return (
    <div className="space-y-4">
      <div className="relative w-64">
        <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
              className="bg-ink-100/60 rounded-2xl p-3 min-h-[200px]"
            >
              <div className="flex items-center gap-2 px-1.5 py-1.5 mb-2">
                <span className={cn("w-2 h-2 rounded-full", col.tone)} />
                <p className="text-[12.5px] font-semibold text-ink-700">{col.status}</p>
                <span className="ml-auto text-[11px] text-ink-400 font-medium">{colTasks.length}</span>
              </div>
              <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5">
                {colTasks.slice(0, PER_COLUMN_LIMIT).map((t) => {
                  const project = projectMap.get(t.projectId);
                  const assignees = t.assigneeIds.map((id) => employeeMap.get(id)?.name).filter(Boolean) as string[];
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      className="bg-white rounded-xl p-3.5 shadow-[0_1px_2px_rgba(11,17,32,0.05)] border border-ink-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <p className="text-[11.5px] text-blue-600 font-medium truncate mb-1">{project?.name}</p>
                      <p className="text-[13px] text-ink-800 font-medium leading-snug">{t.title}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] bg-ink-100 text-ink-500 rounded px-1.5 py-0.5">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <PriorityBadge priority={t.priority} />
                        <span className="text-[11px] text-ink-400">{formatDate(t.dueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-ink-50">
                        <AvatarStack names={assignees} max={3} />
                        <div className="flex items-center gap-2.5 text-ink-400">
                          <span className="flex items-center gap-0.5 text-[11px]"><Paperclip className="w-3 h-3" />{t.attachments}</span>
                          <span className="flex items-center gap-0.5 text-[11px]"><MessageSquare className="w-3 h-3" />{t.comments}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length > PER_COLUMN_LIMIT && (
                  <p className="text-center text-[11px] text-ink-400 py-2">+{colTasks.length - PER_COLUMN_LIMIT} more tasks</p>
                )}
                {colTasks.length === 0 && <p className="text-center text-[12px] text-ink-400 py-6">No tasks</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
