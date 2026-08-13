import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  FileText,
  Receipt,
  Activity as ActivityIcon,
  Wallet,
  ListChecks,
  Clock,
  Pencil,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { getStore } from "@/lib/data/store";
import { projectProfitability } from "@/lib/data/analytics";
import { addProjectPhotosAction, addProjectTaskAction, deleteProjectAction, deleteTaskAction } from "@/lib/actions";
import { TASK_PRIORITIES } from "@/lib/data/constants";
import { RiskBadge, TaskStatusBadge, PriorityBadge, InvoiceStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { ProjectStatusSelect } from "@/components/modules/project-status-select";
import { ConfirmDeleteForm } from "@/components/modules/confirm-delete-form";
import { inputClass, selectClass } from "@/components/ui/form";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const { projects, clients, employees, teams, tasks, documents, invoices, contracts } = store;

  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const client = clients.find((c) => c.id === project.clientId);
  const pm = employees.find((e) => e.id === project.projectManagerId);
  const projectTeams = teams.filter((t) => project.teamIds.includes(t.id));
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectDocs = documents.filter((d) => d.projectId === project.id);
  const projectInvoices = invoices.filter((iv) => iv.projectId === project.id);
  const projectContracts = contracts.filter((c) => c.projectId === project.id);
  const { profit, margin } = projectProfitability(project);
  const crewEmployees = projectTeams.flatMap((t) => employees.filter((e) => e.teamId === t.id));
  const memberNames = crewEmployees.map((e) => e.name);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <Card className="p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] font-semibold text-ink-900 tracking-tight">{project.name}</h1>
              <ProjectStatusSelect projectId={project.id} status={project.status} />
              <RiskBadge risk={project.riskLevel} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-ink-500 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.address}, {project.city}, {project.state}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(project.startDate)} – {formatDate(project.deadline)}</span>
              <span>Client: <span className="text-ink-700 font-medium">{client?.company}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pm && (
              <div className="flex items-center gap-2 bg-ink-50 rounded-lg px-3 py-1.5">
                <Avatar name={pm.name} size={26} />
                <div className="leading-tight">
                  <p className="text-[12px] font-medium text-ink-800">{pm.name}</p>
                  <p className="text-[10.5px] text-ink-400">Project Manager</p>
                </div>
              </div>
            )}
            <Link
              href={`/projects/${project.id}/edit`}
              className="flex items-center gap-1.5 text-[12.5px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
            <ConfirmDeleteForm
              action={deleteProjectAction}
              fields={{ projectId: project.id }}
              confirmMessage={`Delete "${project.name}"? This also removes its tasks, invoices, contracts and documents. This cannot be undone.`}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 text-[12.5px] font-medium bg-white border border-ink-200 hover:bg-danger-100 hover:border-danger-500 hover:text-danger-500 text-ink-700 rounded-lg px-3 py-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </ConfirmDeleteForm>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div>
            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Budget</p>
            <p className="text-[16px] font-semibold text-ink-900 mt-0.5">{formatCurrency(project.budget, { compact: true })}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Spent</p>
            <p className="text-[16px] font-semibold text-ink-900 mt-0.5">{formatCurrency(project.spent, { compact: true })}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Profit</p>
            <p className={`text-[16px] font-semibold mt-0.5 ${profit >= 0 ? "text-success-500" : "text-danger-500"}`}>
              {profit >= 0 ? "+" : ""}
              {formatCurrency(profit, { compact: true })} <span className="text-[11px] font-normal text-ink-400">({margin.toFixed(0)}%)</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Invoiced</p>
            <p className="text-[16px] font-semibold text-ink-900 mt-0.5">{formatCurrency(project.invoicedToDate, { compact: true })}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-1.5">Progress</p>
            <div className="flex items-center gap-2">
              <ProgressBar value={project.progress} tone={project.status === "Behind Schedule" ? "danger" : "blue"} />
              <span className="text-[12px] font-medium text-ink-700">{project.progress}%</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          {
            label: "Overview",
            content: (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 p-5">
                  <h3 className="text-[14px] font-semibold text-ink-900 mb-2">Description</h3>
                  <p className="text-[13px] text-ink-600 leading-relaxed">{project.description}</p>
                  <h3 className="text-[14px] font-semibold text-ink-900 mt-6 mb-3">Milestones</h3>
                  <div className="space-y-3">
                    {project.milestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.done ? "bg-success-500" : "bg-ink-200"}`} />
                        <p className={`text-[13px] flex-1 ${m.done ? "text-ink-700" : "text-ink-400"}`}>{m.label}</p>
                        <p className="text-[12px] text-ink-400">{formatDate(m.date)}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="text-[14px] font-semibold text-ink-900 mb-3 flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" />Assigned Teams</h3>
                  <div className="space-y-2">
                    {projectTeams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                        <div>
                          <p className="text-[12.5px] font-medium text-ink-800">{t.name}</p>
                          <p className="text-[11px] text-ink-400">{t.memberIds.length} members</p>
                        </div>
                        <span className="text-[11px] font-medium text-blue-600">{t.performanceScore}/100</span>
                      </div>
                    ))}
                  </div>
                  {memberNames.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-2">Crew members</p>
                      <AvatarStack names={memberNames} max={8} />
                    </div>
                  )}
                </Card>
              </div>
            ),
          },
          {
            label: "Timeline",
            content: (
              <Card className="p-5">
                <h3 className="text-[14px] font-semibold text-ink-900 mb-5">Construction Timeline</h3>
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-ink-100" />
                  {project.milestones.map((m) => (
                    <div key={m.id} className="relative">
                      <div className={`absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full border-2 ${m.done ? "bg-success-500 border-success-500" : "bg-white border-ink-300"}`} />
                      <p className="text-[13px] font-medium text-ink-800">{m.label}</p>
                      <p className="text-[12px] text-ink-400">{formatDate(m.date, { month: "long", day: "numeric", year: "numeric" })}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },
          {
            label: "Gallery",
            content: (
              <div className="space-y-4">
                <form action={addProjectPhotosAction} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="file"
                    name="photos"
                    accept="image/*"
                    multiple
                    className="text-[12.5px] text-ink-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium px-3.5 py-2 rounded-lg transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photos
                  </button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {project.photos.map((src, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-ink-100">
                      <Image src={src} alt={`Site photo ${i + 1}`} fill sizes="300px" className="object-cover" unoptimized />
                    </div>
                  ))}
                  {project.photos.length === 0 && (
                    <p className="col-span-full text-center text-ink-400 text-[13px] py-10">No photos uploaded yet.</p>
                  )}
                </div>
              </div>
            ),
          },
          {
            id: "tasks",
            label: `Tasks (${projectTasks.length})`,
            content: (
              <div className="space-y-4">
                <Card className="p-4">
                  <form action={addProjectTaskAction} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_150px_auto] gap-2.5">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input name="title" required placeholder="Add a task for this project…" className={inputClass} />
                    <select name="priority" defaultValue="Medium" className={selectClass}>
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input type="date" name="dueDate" className={inputClass} />
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </form>
                </Card>
                <Card className="overflow-hidden">
                  <div className="divide-y divide-ink-50">
                    {projectTasks.slice(0, 30).map((t) => {
                      const assignees = employees.filter((e) => t.assigneeIds.includes(e.id)).map((e) => e.name);
                      return (
                        <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                          <ListChecks className="w-4 h-4 text-ink-300 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-ink-800 truncate">{t.title}</p>
                            <p className="text-[11.5px] text-ink-400">Due {formatDate(t.dueDate)}</p>
                          </div>
                          <AvatarStack names={assignees} max={2} />
                          <PriorityBadge priority={t.priority} />
                          <TaskStatusBadge status={t.status} />
                          <ConfirmDeleteForm
                            action={deleteTaskAction}
                            fields={{ taskId: t.id, projectId: project.id }}
                            confirmMessage={`Delete task "${t.title}"?`}
                          >
                            <button type="submit" className="text-ink-300 hover:text-danger-500 transition-colors p-1" title="Delete task">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </ConfirmDeleteForm>
                        </div>
                      );
                    })}
                    {projectTasks.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No tasks yet — add the first one above.</p>}
                  </div>
                </Card>
              </div>
            ),
          },
          {
            id: "documents",
            label: `Documents (${projectDocs.length})`,
            content: (
              <Card className="overflow-hidden">
                <div className="divide-y divide-ink-50">
                  {projectDocs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink-800 truncate">{d.name}</p>
                        <p className="text-[11.5px] text-ink-400">Uploaded by {d.uploadedBy} · {formatDate(d.uploadDate)}</p>
                      </div>
                      <span className="text-[11px] text-ink-400">{d.fileSize}</span>
                      <span className="text-[10.5px] bg-ink-100 text-ink-500 rounded px-1.5 py-0.5">{d.fileType}</span>
                    </div>
                  ))}
                  {projectDocs.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No documents uploaded yet.</p>}
                </div>
              </Card>
            ),
          },
          {
            label: `Invoices & Contracts`,
            content: (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="overflow-hidden">
                  <CardHeader title="Invoices" subtitle={`${projectInvoices.length} total`} />
                  <div className="divide-y divide-ink-50 mt-2">
                    {projectInvoices.map((iv) => (
                      <div key={iv.id} className="flex items-center gap-3 px-5 py-3">
                        <Receipt className="w-4 h-4 text-ink-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink-800">{iv.number}</p>
                          <p className="text-[11.5px] text-ink-400">Due {formatDate(iv.dueDate)}</p>
                        </div>
                        <span className="text-[13px] font-medium text-ink-700">{formatCurrency(iv.amount, { compact: true })}</span>
                        <InvoiceStatusBadge status={iv.status} />
                      </div>
                    ))}
                    {projectInvoices.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No invoices yet.</p>}
                  </div>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader title="Contracts" subtitle={`${projectContracts.length} total`} />
                  <div className="divide-y divide-ink-50 mt-2">
                    {projectContracts.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                        <FileText className="w-4 h-4 text-ink-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink-800 truncate">{c.title}</p>
                          <p className="text-[11.5px] text-ink-400">{c.type} · Signed {formatDate(c.signedDate)}</p>
                        </div>
                        <span className="text-[13px] font-medium text-ink-700">{formatCurrency(c.value, { compact: true })}</span>
                      </div>
                    ))}
                    {projectContracts.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No contracts yet.</p>}
                  </div>
                </Card>
              </div>
            ),
          },
          {
            label: "Budget & Expenses",
            content: (
              <Card className="p-5">
                <h3 className="text-[14px] font-semibold text-ink-900 mb-4 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-blue-500" />Budget Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span className="text-ink-500">Spent of Budget</span>
                      <span className="font-medium text-ink-800">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
                    </div>
                    <ProgressBar value={(project.spent / project.budget) * 100} tone={project.spent > project.budget ? "danger" : "blue"} />
                  </div>
                  <div>
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span className="text-ink-500">Invoiced of Spend</span>
                      <span className="font-medium text-ink-800">{formatCurrency(project.invoicedToDate)} / {formatCurrency(project.spent)}</span>
                    </div>
                    <ProgressBar value={(project.invoicedToDate / project.spent) * 100} tone="success" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ink-100">
                  <div>
                    <p className="text-[11px] text-ink-400 uppercase tracking-wide">Budget</p>
                    <p className="text-[18px] font-semibold text-ink-900">{formatCurrency(project.budget, { compact: true })}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-400 uppercase tracking-wide">Spent</p>
                    <p className="text-[18px] font-semibold text-ink-900">{formatCurrency(project.spent, { compact: true })}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-400 uppercase tracking-wide">Profit</p>
                    <p className={`text-[18px] font-semibold ${profit >= 0 ? "text-success-500" : "text-danger-500"}`}>{formatCurrency(profit, { compact: true })}</p>
                  </div>
                </div>
              </Card>
            ),
          },
          {
            label: "Activity",
            content: (
              <Card className="p-5">
                <h3 className="text-[14px] font-semibold text-ink-900 mb-4 flex items-center gap-1.5"><ActivityIcon className="w-4 h-4 text-blue-500" />Activity Feed</h3>
                <div className="space-y-4">
                  {project.activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <Avatar name={a.actor} size={28} />
                      <div>
                        <p className="text-[13px] text-ink-700"><span className="font-medium text-ink-900">{a.actor}</span> {a.action}</p>
                        <p className="text-[11.5px] text-ink-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatDate(a.date, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <h3 className="text-[14px] font-semibold text-ink-900 mt-8 mb-4">Comments</h3>
                <div className="space-y-4">
                  {project.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar name={c.authorName} size={28} />
                      <div className="bg-ink-50 rounded-xl px-3.5 py-2.5 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[12.5px] font-medium text-ink-800">{c.authorName}</p>
                          <p className="text-[11px] text-ink-400">{formatDate(c.date)}</p>
                        </div>
                        <p className="text-[12.5px] text-ink-600 mt-0.5">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },
          {
            label: "AI Summary",
            content: (
              <Card className="p-6 bg-gradient-to-br from-navy-900 to-navy-800 text-white border-navy-800">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  <h3 className="text-[14px] font-semibold">AI Project Summary</h3>
                </div>
                <p className="text-[13.5px] text-ink-200 leading-relaxed">
                  <span className="font-medium text-white">{project.name}</span> is currently{" "}
                  <span className="font-medium text-white">{project.progress}% complete</span> and marked{" "}
                  <span className="font-medium text-white">{project.status}</span> with {project.riskLevel.toLowerCase()} risk.
                  {" "}The project has spent {formatCurrency(project.spent, { compact: true })} of a{" "}
                  {formatCurrency(project.budget, { compact: true })} budget, {profit >= 0 ? "tracking under budget" : "currently over budget"} by{" "}
                  {formatCurrency(Math.abs(profit), { compact: true })}. {projectTasks.filter((t) => t.status === "Blocked").length} task(s) are blocked and{" "}
                  {projectInvoices.filter((iv) => iv.status === "Overdue").length} invoice(s) are overdue on this job.
                  {project.status === "Behind Schedule"
                    ? " Recommend reallocating additional crew resources to recover schedule before the next milestone."
                    : " Project is tracking to plan — maintain current crew allocation and cadence."}
                </p>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
