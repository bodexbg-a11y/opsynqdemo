import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle, Building2, Receipt, FileText } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { getClientStats } from "@/lib/data/analytics";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { ProjectStatusBadge, InvoiceStatusBadge } from "@/components/ui/badge";
import { ClientStatusSelect } from "@/components/modules/client-status-select";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const { clients, projects, invoices, contracts } = store;
  const client = clients.find((c) => c.id === id);
  if (!client) notFound();

  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const clientInvoices = invoices.filter((iv) => iv.clientId === client.id);
  const clientContracts = contracts.filter((c) => c.clientId === client.id);
  const stats = getClientStats(store, client.id);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={client.company}
        subtitle={`${client.industry} · Client since ${formatDate(client.since)}`}
        action={<ClientStatusSelect clientId={client.id} status={client.status} className="text-[12.5px] py-1.5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-[14px] font-semibold text-ink-900 mb-3 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-500" />Company Info</h3>
          <div className="space-y-2.5 text-[12.5px] text-ink-600">
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-ink-400" />{client.address}, {client.city}, {client.state}</div>
          </div>
          <h3 className="text-[14px] font-semibold text-ink-900 mt-6 mb-3">Contacts</h3>
          <div className="space-y-3">
            {client.contacts.map((c) => (
              <div key={c.id} className="rounded-lg bg-ink-50 px-3 py-2.5">
                <p className="text-[12.5px] font-medium text-ink-800">{c.name}</p>
                <p className="text-[11px] text-ink-400 mb-1.5">{c.title}</p>
                <div className="flex items-center gap-1.5 text-[11.5px] text-ink-500"><Mail className="w-3 h-3" />{c.email}</div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-ink-500 mt-0.5"><Phone className="w-3 h-3" />{c.phone}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Total Projects</p>
              <p className="text-[18px] font-semibold text-ink-900 mt-1">{stats.totalProjects}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Total Invoiced</p>
              <p className="text-[18px] font-semibold text-ink-900 mt-1">{formatCurrency(stats.totalInvoiced, { compact: true })}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Outstanding</p>
              <p className={`text-[18px] font-semibold mt-1 ${stats.outstandingBalance > 0 ? "text-warning-500" : "text-ink-900"}`}>{formatCurrency(stats.outstandingBalance, { compact: true })}</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Projects" subtitle={`${clientProjects.length} total`} />
            <div className="divide-y divide-ink-50 mt-2">
              {clientProjects.map((p) => (
                <Link href={`/projects/${p.id}`} key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink-800 truncate">{p.name}</p>
                    <p className="text-[11.5px] text-ink-400">{p.city}, {p.state}</p>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </Link>
              ))}
              {clientProjects.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No projects yet.</p>}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Invoices" subtitle={`${clientInvoices.length} total`} />
              <div className="divide-y divide-ink-50 mt-2">
                {clientInvoices.map((iv) => (
                  <div key={iv.id} className="flex items-center gap-3 px-5 py-3">
                    <Receipt className="w-4 h-4 text-ink-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-ink-800">{iv.number}</p>
                    </div>
                    <span className="text-[12.5px] text-ink-700">{formatCurrency(iv.amount, { compact: true })}</span>
                    <InvoiceStatusBadge status={iv.status} />
                  </div>
                ))}
                {clientInvoices.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No invoices yet.</p>}
              </div>
            </Card>
            <Card>
              <CardHeader title="Contracts" subtitle={`${clientContracts.length} total`} />
              <div className="divide-y divide-ink-50 mt-2">
                {clientContracts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText className="w-4 h-4 text-ink-300 shrink-0" />
                    <p className="flex-1 text-[12.5px] font-medium text-ink-800 truncate">{c.title}</p>
                    <span className="text-[12.5px] text-ink-700">{formatCurrency(c.value, { compact: true })}</span>
                  </div>
                ))}
                {clientContracts.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No contracts yet.</p>}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Communication Log" subtitle="Recent interactions" />
            <div className="divide-y divide-ink-50 mt-2">
              {client.communications.map((m) => (
                <div key={m.id} className="flex items-start gap-3 px-5 py-3">
                  <MessageCircle className="w-4 h-4 text-ink-300 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[12.5px] text-ink-700">{m.note}</p>
                    <p className="text-[11px] text-ink-400 mt-0.5">{m.channel} · {formatDate(m.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
