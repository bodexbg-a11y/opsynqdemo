"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Paperclip, MessageSquare, Plus, Pencil, Trash2, LayoutGrid, List as ListIcon } from "lucide-react";
import type { Task, TaskStatus, Employee, Project } from "@/lib/data/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/data/constants";
import { moveTaskStatusAction, deleteTaskByIdAction } from "@/lib/actions";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import {
  SearchInput,
  FilterSelect,
  FilterSelectPairs,
  ClearFiltersButton,
  SortHeader,
  nextSort,
  compareValues,
} from "@/components/ui/filter-bar";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import { TaskDialog } from "./task-dialog";
import { cn, formatDate } from "@/lib/utils";

const COLUMNS: { status: TaskStatus; tone: string }[] = [
  { status: "To Do", tone: "bg-ink-300" },
  { status: "In Progress", tone: "bg-blue-500" },
  { status: "Blocked", tone: "bg-danger-500" },
  { status: "Completed", tone: "bg-success-500" },
];

const PER_COLUMN_LIMIT = 40;
const PRIORITY_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };
const STATUS_ORDER: Record<string, number> = { "To Do": 0, "In Progress": 1, Blocked: 2, Completed: 3 };

type SortKey = "title" | "project" | "status" | "priority" | "dueDate";

export function TasksWorkspace({
  tasks,
  employees,
  projects,
  canEdit,
}: {
  tasks: Task[];
  employees: Employee[];
  projects: Project[];
  canEdit: boolean;
}) {
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("All");
  const [pmId, setPmId] = useState("All");
  const [status, setStatus] = useState<TaskStatus | "All">("All");
  const [priority, setPriority] = useState<(typeof TASK_PRIORITIES)[number] | "All">("All");
  const [assigneeId, setAssigneeId] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({ key: null, dir: "asc" });

  const [dragId, setDragId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic status overrides so a dropped card re-renders instantly while the
  // server action persists in the background.
  const [pendingMoves, setPendingMoves] = useState<Record<string, TaskStatus>>({});

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const resolved = useMemo(
    () => tasks.map((t) => (pendingMoves[t.id] ? { ...t, status: pendingMoves[t.id] } : t)),
    [tasks, pendingMoves]
  );

  const projectOptions = useMemo(
    () =>
      [...projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );

  // Managers are derived from the visible projects so the filter mirrors "who owns work here".
  const pmOptions = useMemo(() => {
    const ids = new Set(projects.map((p) => p.projectManagerId));
    return employees
      .filter((e) => ids.has(e.id))
      .map((e) => ({ value: e.id, label: e.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projects, employees]);

  const assigneeOptions = useMemo(() => {
    const ids = new Set(tasks.flatMap((t) => t.assigneeIds));
    return employees
      .filter((e) => ids.has(e.id))
      .map((e) => ({ value: e.id, label: e.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks, employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resolved.filter((t) => {
      const project = projectMap.get(t.projectId);
      if (projectId !== "All" && t.projectId !== projectId) return false;
      if (pmId !== "All" && project?.projectManagerId !== pmId) return false;
      if (status !== "All" && t.status !== status) return false;
      if (priority !== "All" && t.priority !== priority) return false;
      if (assigneeId !== "All" && !t.assigneeIds.includes(assigneeId)) return false;
      if (q && !`${t.title} ${t.description} ${project?.name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resolved, projectId, pmId, status, priority, assigneeId, query, projectMap]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const key = sort.key;
    const rows = [...filtered].sort((a, b) => {
      switch (key) {
        case "title":
          return compareValues(a.title, b.title);
        case "project":
          return compareValues(projectMap.get(a.projectId)?.name, projectMap.get(b.projectId)?.name);
        case "status":
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        default:
          return 0;
      }
    });
    return sort.dir === "asc" ? rows : rows.reverse();
  }, [filtered, sort, projectMap]);

  const hasFilters =
    projectId !== "All" || pmId !== "All" || status !== "All" || priority !== "All" || assigneeId !== "All" || query !== "";

  const clearAll = () => {
    setProjectId("All");
    setPmId("All");
    setStatus("All");
    setPriority("All");
    setAssigneeId("All");
    setQuery("");
  };

  function handleDrop(next: TaskStatus) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    const current = resolved.find((t) => t.id === id);
    if (!current || current.status === next) return;

    setPendingMoves((prev) => ({ ...prev, [id]: next }));
    startTransition(async () => {
      await moveTaskStatusAction(id, next);
    });
  }

  const selectedProject = projectId !== "All" ? projectMap.get(projectId) : undefined;
  const activeProjectPm = selectedProject ? employeeMap.get(selectedProject.projectManagerId) : undefined;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelectPairs label="Project" value={projectId} options={projectOptions} onChange={setProjectId} allLabel="All projects" />
        <FilterSelectPairs label="Project Manager" value={pmId} options={pmOptions} onChange={setPmId} allLabel="All managers" />
        <FilterSelect label="Status" value={status} options={TASK_STATUSES} onChange={setStatus} allLabel="Any status" />
        <FilterSelect label="Priority" value={priority} options={TASK_PRIORITIES} onChange={setPriority} allLabel="Any priority" />
        <FilterSelectPairs label="Assignee" value={assigneeId} options={assigneeOptions} onChange={setAssigneeId} allLabel="Anyone" />
        <SearchInput value={query} onChange={setQuery} placeholder="Search tasks…" className="w-52" />
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center bg-ink-100 rounded-lg p-0.5">
            <button
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                view === "board" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                view === "list" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              )}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
          </div>
          {canEdit && projects.length > 0 && (
            <button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Selected-project context banner */}
      {selectedProject && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <div className="flex-1 min-w-0">
            <Link href={`/projects/${selectedProject.id}`} className="text-[13px] font-semibold text-ink-900 hover:text-blue-700">
              {selectedProject.name}
            </Link>
            <p className="text-[11.5px] text-ink-500 mt-0.5">
              {selectedProject.city}, {selectedProject.state} · {selectedProject.status} · {selectedProject.progress}% complete
              {activeProjectPm && <> · PM {activeProjectPm.name}</>}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            {COLUMNS.map((c) => (
              <div key={c.status} className="text-center">
                <p className="font-semibold text-ink-800">{filtered.filter((t) => t.status === c.status).length}</p>
                <p className="text-[10.5px] text-ink-400">{c.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12px] text-ink-400">
        {sorted.length} of {tasks.length} tasks
      </p>

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = sorted.filter((t) => t.status === col.status);
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
                <div className="space-y-2.5 max-h-[calc(100vh-380px)] overflow-y-auto pr-0.5">
                  {colTasks.slice(0, PER_COLUMN_LIMIT).map((t) => {
                    const project = projectMap.get(t.projectId);
                    const assignees = t.assigneeIds.map((id) => employeeMap.get(id)?.name).filter(Boolean) as string[];
                    return (
                      <div
                        key={t.id}
                        draggable={canEdit}
                        onDragStart={() => setDragId(t.id)}
                        className={cn(
                          "group bg-white rounded-xl p-3.5 shadow-[0_1px_2px_rgba(11,17,32,0.05)] border border-ink-100 hover:shadow-md transition-shadow",
                          canEdit && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/projects/${t.projectId}`} className="text-[11.5px] text-blue-600 font-medium truncate hover:underline">
                            {project?.name}
                          </Link>
                          {canEdit && (
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => {
                                  setEditing(t);
                                  setDialogOpen(true);
                                }}
                                className="text-ink-400 hover:text-blue-600"
                                title="Edit task"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <ConfirmDeleteForm
                                action={deleteTaskByIdAction}
                                fields={{ taskId: t.id }}
                                confirmMessage={`Delete task "${t.title}"?`}
                                className="flex"
                              >
                                <button type="submit" className="text-ink-400 hover:text-danger-500" title="Delete task">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </ConfirmDeleteForm>
                            </div>
                          )}
                        </div>
                        <p className="text-[13px] text-ink-800 font-medium leading-snug mt-1">{t.title}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {t.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] bg-ink-100 text-ink-500 rounded px-1.5 py-0.5">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <PriorityBadge priority={t.priority} />
                          <span className="text-[11px] text-ink-400">{formatDate(t.dueDate)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-ink-50">
                          <AvatarStack names={assignees} max={3} />
                          <div className="flex items-center gap-2.5 text-ink-400">
                            <span className="flex items-center gap-0.5 text-[11px]">
                              <Paperclip className="w-3 h-3" />
                              {t.attachments}
                            </span>
                            <span className="flex items-center gap-0.5 text-[11px]">
                              <MessageSquare className="w-3 h-3" />
                              {t.comments}
                            </span>
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
      ) : (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                  <SortHeader column="title" label="Task" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort((s) => nextSort(s, c))} className="px-5" />
                  <SortHeader column="project" label="Project" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort((s) => nextSort(s, c))} />
                  <SortHeader column="status" label="Status" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort((s) => nextSort(s, c))} />
                  <SortHeader column="priority" label="Priority" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort((s) => nextSort(s, c))} />
                  <th className="px-4 py-3 font-medium">Assignees</th>
                  <SortHeader column="dueDate" label="Due" sortKey={sort.key} sortDir={sort.dir} onSort={(c) => setSort((s) => nextSort(s, c))} />
                  {canEdit && <th className="px-4 py-3 font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 300).map((t) => {
                  const project = projectMap.get(t.projectId);
                  const assignees = t.assigneeIds.map((id) => employeeMap.get(id)?.name).filter(Boolean) as string[];
                  return (
                    <tr key={t.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-800">{t.title}</p>
                        {t.description && <p className="text-ink-400 text-[11.5px] mt-0.5 line-clamp-1">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/projects/${t.projectId}`} className="text-blue-600 hover:underline">
                          {project?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <AvatarStack names={assignees} max={3} />
                      </td>
                      <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(t.dueDate)}</td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => {
                                setEditing(t);
                                setDialogOpen(true);
                              }}
                              className="text-ink-400 hover:text-blue-600 transition-colors"
                              title="Edit task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <ConfirmDeleteForm
                              action={deleteTaskByIdAction}
                              fields={{ taskId: t.id }}
                              confirmMessage={`Delete task "${t.title}"?`}
                              className="flex"
                            >
                              <button type="submit" className="text-ink-400 hover:text-danger-500 transition-colors" title="Delete task">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </ConfirmDeleteForm>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No tasks match your filters.</div>}
        </div>
      )}

      {canEdit && (
        <TaskDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          task={editing}
          projects={projects}
          employees={employees}
          defaultProjectId={projectId !== "All" ? projectId : undefined}
        />
      )}
    </div>
  );
}
