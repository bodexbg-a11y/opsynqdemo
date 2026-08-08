"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Integration {
  name: string;
  desc: string;
  connected: boolean;
  color: string;
  initial: string;
  href?: string;
  hrefLabel?: string;
}

const INTEGRATIONS: Integration[] = [
  { name: "Facebook Ads", desc: "Track campaign spend, leads and ROAS from Meta Ads Manager", connected: true, color: "bg-[#1877F2]", initial: "f", href: "/marketing", hrefLabel: "View campaigns" },
  { name: "Google Ads", desc: "Sync Search, Performance Max and Display campaign performance", connected: true, color: "bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05]", initial: "G", href: "/marketing", hrefLabel: "View campaigns" },
  { name: "Google Calendar", desc: "Sync project deadlines and crew schedules", connected: true, color: "bg-blue-500", initial: "G" },
  { name: "Microsoft Outlook", desc: "Two-way calendar and email sync", connected: true, color: "bg-sky-600", initial: "O" },
  { name: "QuickBooks", desc: "Sync invoices, expenses and payroll", connected: true, color: "bg-success-500", initial: "Q" },
  { name: "Xero", desc: "Accounting and financial reporting sync", connected: false, color: "bg-blue-400", initial: "X" },
  { name: "Zapier", desc: "Connect OPSYNQ to 5,000+ apps", connected: false, color: "bg-orange-500", initial: "Z" },
  { name: "WhatsApp Business", desc: "Client and crew messaging", connected: true, color: "bg-emerald-500", initial: "W" },
  { name: "Microsoft Teams", desc: "Project channel notifications", connected: false, color: "bg-indigo-600", initial: "T" },
  { name: "Email (SMTP)", desc: "Automated invoice and report delivery", connected: true, color: "bg-navy-700", initial: "E" },
];

export function IntegrationsGrid() {
  const [state, setState] = useState(INTEGRATIONS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {state.map((integration, i) => (
        <Card key={integration.name} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-[15px]", integration.color)}>
                {integration.initial}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-ink-900">{integration.name}</p>
                {integration.connected && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-success-500 font-medium mt-0.5">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-[12px] text-ink-500 mt-3 leading-relaxed">{integration.desc}</p>
          {integration.connected && integration.href && (
            <Link href={integration.href} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-blue-600 hover:text-blue-700 mt-2">
              {integration.hrefLabel ?? "Open"} <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
          <button
            onClick={() =>
              setState((prev) => prev.map((it, idx) => (idx === i ? { ...it, connected: !it.connected } : it)))
            }
            className={cn(
              "mt-4 w-full text-[12.5px] font-medium py-2 rounded-lg transition-colors",
              integration.connected ? "bg-ink-100 text-ink-600 hover:bg-ink-200" : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {integration.connected ? "Disconnect" : "Connect"}
          </button>
        </Card>
      ))}
    </div>
  );
}
