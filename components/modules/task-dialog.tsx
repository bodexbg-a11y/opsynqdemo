"use client";

import type { Task, Employee, Project } from "@/lib/data/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/data/constants";
import { createTaskAction, updateTaskAction } from "@/lib/actions";
import { Modal } from "@/components/ui/modal";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/form";

/** Create/edit form for a task. `task` present ⇒ edit mode. */
export function TaskDialog({
  open,
  onClose,
  task,
  projects,
  employees,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  projects: Project[];
  employees: Employee[];
  defaultProjectId?: string;
}) {
  const editing = Boolean(task);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Task" : "New Task"}
      subtitle={editing ? task?.title : "Add a task to one of your projects"}
    >
      <form action={editing ? updateTaskAction : createTaskAction} className="space-y-4">
        {editing && <input type="hidden" name="taskId" value={task!.id} />}

        <FormField label="Title" required>
          <input name="title" required defaultValue={task?.title} className={inputClass} placeholder="Pour foundation slab — Zone B" />
        </FormField>

        <FormField label="Project" required>
          <select name="projectId" required defaultValue={task?.projectId ?? defaultProjectId ?? ""} className={selectClass}>
            <option value="" disabled>
              Select a project…
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Status">
            <select name="status" defaultValue={task?.status ?? "To Do"} className={selectClass}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority">
            <select name="priority" defaultValue={task?.priority ?? "Medium"} className={selectClass}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Due Date">
            <input type="date" name="dueDate" defaultValue={task?.dueDate.slice(0, 10)} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Assignees" hint="Hold Ctrl/Cmd to select several">
          <select name="assigneeIds" multiple defaultValue={task?.assigneeIds ?? []} className={`${inputClass} min-h-[110px]`}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.role}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Description">
          <textarea name="description" defaultValue={task?.description} className={textareaClass} placeholder="What needs to happen…" />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-ink-600 hover:bg-ink-50 border border-ink-200 rounded-lg px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors shadow-sm shadow-blue-600/20"
          >
            {editing ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
