"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, Receipt, Wallet, FileSignature } from "lucide-react";
import type { Project, Invoice, Contract, Client, Employee, Task } from "@/lib/data/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, InvoiceStatusBadge, ProjectStatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FilterSelectPairs, SearchInput } from "@/components/ui/filter-bar";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  project: Project;
  budget: number;
  spent: number;
  remaining: number;
  usedPct: number;
  collected: number;
  outstanding: number;
  overdue: number;
  contractValue: number;
  profit: number;
  margin: number;
}

function Stat({
  label,
  value,
  tone,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger" | "warning" | "blue";
  sub?: string;
  icon?: typeof Wallet;
}) {
  const toneClass =
    tone === "success"
      ? "text-success-500"
      : tone === "danger"
        ? "text-danger-500"
        : tone === "warning"
          ? "text-warning-500"
          : tone === "blue"
            ? "text-blue-600"
            : "text-ink-900";
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3">
      <p className="text-[11px] text-ink-400 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={cn("text-[18px] font-semibold mt-1", toneClass)}>{value}</p>
      {sub && <p className="text-[11.5px] text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Finance drill-down: pick a project and see its full income/expense picture. */
export function ProjectFinanceExplorer({
  projects,
  invoices,
  contracts,
  clients,
  employees,
  tasks,
}: {
  projects: Project[];
  invoices: Invoice[];
  contracts: Contract[];
  clients: Client[];
  employees: Employee[];
  tasks: Task[];
}) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "All");
  const [query, setQuery] = useState("");

  const rows: Row[] = useMemo(
    () =>
      projects.map((p) => {
        const pInv = invoices.filter((iv) => iv.projectId === p.id);
        const collected = pInv.filter((iv) => iv.status === "Paid").reduce((s, iv) => s + iv.amount, 0);
        const overdue = pInv.filter((iv) => iv.status === "Overdue").reduce((s, iv) => s + iv.amount, 0);
        const outstanding = pInv
          .filter((iv) => iv.status === "Pending" || iv.status === "Overdue")
          .reduce((s, iv) => s + iv.amount, 0);
        const contractValue = contracts.filter((c) => c.projectId === p.id).reduce((s, c) => s + c.value, 0);
        const profit = p.budget - p.spent;
        return {
          project: p,
          budget: p.budget,
          spent: p.spent,
          remaining: p.budget - p.spent,
          usedPct: p.budget ? (p.spent / p.budget) * 100 : 0,
          collected,
          outstanding,
          overdue,
          contractValue,
          profit,
          margin: p.budget ? (profit / p.budget) * 100 : 0,
        };
      }),
    [projects, invoices, contracts]
  );

  const projectOptions = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );

  const selected = rows.find((r) => r.project.id === projectId);
  const client = selected ? clients.find((c) => c.id === selected.project.clientId) : undefined;
  const pm = selected ? employees.find((e) => e.id === selected.project.projectManagerId) : undefined;

  const projectInvoices = useMemo(() => {
    if (!selected) return [];
    const q = query.trim().toLowerCase();
    return invoices
      .filter((iv) => iv.projectId === selected.project.id)
      .filter((iv) => !q || iv.number.toLowerCase().includes(q) || iv.status.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, selected, query]);

  const projectContracts = useMemo(
    () => (selected ? contracts.filter((c) => c.projectId === selected.project.id) : []),
    [contracts, selected]
  );

  const taskStats = useMemo(() => {
    if (!selected) return { total: 0, done: 0 };
    const pTasks = tasks.filter((t) => t.projectId === selected.project.id);
    return { total: pTasks.length, done: pTasks.filter((t) => t.status === "Completed").length };
  }, [tasks, selected]);

  if (!selected) {
    return <div className="card-surface rounded-2xl p-10 text-center text-ink-400 text-[13px]">No projects available.</div>;
  }

  const overBudget = selected.spent > selected.budget;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelectPairs label="Project" value={projectId} options={projectOptions} onChange={setProjectId} allLabel="Select a project" />
        <Link
          href={`/projects/${selected.project.id}`}
          className="text-[12.5px] font-medium text-blue-600 hover:underline px-2 py-1.5"
        >
          Open project →
        </Link>
      </div>

      {/* Project header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[16px] font-semibold text-ink-900">{selected.project.name}</h3>
              <ProjectStatusBadge status={selected.project.status} />
              {overBudget && (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3" />
                  Over budget
                </Badge>
              )}
            </div>
            <p className="text-[12.5px] text-ink-500 mt-1">
              {client?.company} · {selected.project.city}, {selected.project.state}
              {pm && <> · PM {pm.name}</>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Net Position</p>
            <p className={cn("text-[22px] font-semibold", selected.profit >= 0 ? "text-success-500" : "text-danger-500")}>
              {selected.profit >= 0 ? "+" : ""}
              {formatCurrency(selected.profit, { compact: true })}
            </p>
            <p className="text-[11.5px] text-ink-400">{selected.margin.toFixed(1)}% margin</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-ink-500">
              Budget consumed · {formatCurrency(selected.spent, { compact: true })} of {formatCurrency(selected.budget, { compact: true })}
            </span>
            <span className={cn("font-medium", overBudget ? "text-danger-500" : "text-ink-700")}>{selected.usedPct.toFixed(0)}%</span>
          </div>
          <ProgressBar value={Math.min(100, selected.usedPct)} tone={overBudget ? "danger" : selected.usedPct > 85 ? "warning" : "success"} />
        </div>
      </Card>

      {/* Income vs expenses */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Contract Value"
          value={formatCurrency(selected.contractValue, { compact: true })}
          sub={`${projectContracts.length} contract${projectContracts.length === 1 ? "" : "s"}`}
          icon={FileSignature}
          tone="blue"
        />
        <Stat
          label="Collected"
          value={formatCurrency(selected.collected, { compact: true })}
          sub="Paid invoices"
          icon={TrendingUp}
          tone="success"
        />
        <Stat
          label="Outstanding"
          value={formatCurrency(selected.outstanding, { compact: true })}
          sub={selected.overdue > 0 ? `${formatCurrency(selected.overdue, { compact: true })} overdue` : "Nothing overdue"}
          icon={Receipt}
          tone={selected.overdue > 0 ? "danger" : "warning"}
        />
        <Stat
          label="Spent to Date"
          value={formatCurrency(selected.spent, { compact: true })}
          sub={
            overBudget
              ? `${formatCurrency(Math.abs(selected.remaining), { compact: true })} over`
              : `${formatCurrency(selected.remaining, { compact: true })} left`
          }
          icon={TrendingDown}
          tone={overBudget ? "danger" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Invoices */}
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-1 gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-ink-900">Invoices</h3>
              <p className="text-[12px] text-ink-400 mt-0.5">{projectInvoices.length} issued for this project</p>
            </div>
            <SearchInput value={query} onChange={setQuery} placeholder="Search invoices…" className="w-44" />
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-y border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                  <th className="px-5 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Issued</th>
                  <th className="px-4 py-2.5 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {projectInvoices.map((iv) => (
                  <tr key={iv.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                    <td className="px-5 py-2.5 font-medium text-ink-800">{iv.number}</td>
                    <td className="px-4 py-2.5 text-ink-700 whitespace-nowrap">{formatCurrency(iv.amount)}</td>
                    <td className="px-4 py-2.5">
                      <InvoiceStatusBadge status={iv.status} />
                    </td>
                    <td className="px-4 py-2.5 text-ink-500 whitespace-nowrap">{formatDate(iv.issueDate)}</td>
                    <td className="px-4 py-2.5 text-ink-500 whitespace-nowrap">{formatDate(iv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projectInvoices.length === 0 && (
            <div className="p-8 text-center text-ink-400 text-[13px]">No invoices for this project yet.</div>
          )}
        </Card>

        {/* Side panel */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader title="Contracts" subtitle={`${projectContracts.length} on file`} />
            <div className="divide-y divide-ink-50 mt-2">
              {projectContracts.map((c) => (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-medium text-ink-800">{c.title}</p>
                    <Badge variant={c.status === "Signed" ? "success" : c.status === "Pending" ? "warning" : "neutral"}>{c.status}</Badge>
                  </div>
                  <p className="text-[11.5px] text-ink-400 mt-0.5">
                    {c.type} · {formatCurrency(c.value, { compact: true })} · {formatDate(c.signedDate)}
                  </p>
                </div>
              ))}
              {projectContracts.length === 0 && <p className="px-5 py-6 text-center text-[12.5px] text-ink-400">No contracts.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-3">Delivery Snapshot</h3>
            <div className="space-y-3 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Progress</span>
                <span className="font-medium text-ink-800">{selected.project.progress}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Tasks completed</span>
                <span className="font-medium text-ink-800">
                  {taskStats.done} / {taskStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Invoiced to date</span>
                <span className="font-medium text-ink-800">{formatCurrency(selected.project.invoicedToDate, { compact: true })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Deadline</span>
                <span className="font-medium text-ink-800">{formatDate(selected.project.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Cost per % complete</span>
                <span className="font-medium text-ink-800">
                  {selected.project.progress > 0
                    ? formatCurrency(selected.spent / selected.project.progress, { compact: true })
                    : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
