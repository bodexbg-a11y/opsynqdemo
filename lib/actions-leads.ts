"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { requireAdmin } from "./auth";
import { nextEntityId } from "./data/ids";
import { LEAD_STATUSES, type LeadStatus } from "./data/constants";
import { getFacebookToken, explainGraphError } from "./facebook/client";
import { fetchAdAccounts, fetchAllAds } from "./facebook/marketing";
import { collectLeads, mapLeadFields } from "./facebook/leads";

/** Encodes the sync outcome into the redirect so the page can report it. */
function backToLeads(params: Record<string, string | number>): never {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) search.set(key, String(value));
  redirect(`/leads?${search.toString()}`);
}

/**
 * Pulls every lead-form submission Meta will hand over and stores it locally.
 *
 * Covers all ad accounts the token can see and all ads within them — including
 * paused campaigns, which still hold the leads they collected while running.
 * Upserts on Meta's lead id, so running it repeatedly refreshes rather than
 * duplicates, and locally-set status/notes survive a re-sync.
 */
export async function syncFacebookLeadsAction() {
  await requireAdmin();

  const token = await getFacebookToken();
  if (!token) {
    backToLeads({ error: "Facebook is not connected. Add an access token in Settings → Integrations." });
  }

  const accountsRes = await fetchAdAccounts(token);
  if (!accountsRes.ok) {
    backToLeads({ error: `${accountsRes.error.message} — ${explainGraphError(accountsRes.error)}` });
  }

  const accounts = accountsRes.data;
  if (!accounts.length) {
    backToLeads({ error: "This token can't see any ad accounts." });
  }

  // Snapshot what we already hold, so the sync can report new vs. refreshed
  // without a lookup per lead.
  const stored = await prisma.lead.findMany({ select: { id: true, fbLeadId: true } });
  const known = new Set(stored.map((r) => r.fbLeadId));
  const idPool = stored.map((r) => ({ id: r.id }));

  let created = 0;
  let updated = 0;
  let scannedAds = 0;
  const problems: string[] = [];

  for (const account of accounts) {
    const adsRes = await fetchAllAds(token, account);
    if (!adsRes.ok) {
      problems.push(`${account.name}: ${adsRes.error.message}`);
      continue;
    }
    scannedAds += adsRes.data.length;

    const leadsRes = await collectLeads(token, adsRes.data);
    if (!leadsRes.ok) {
      problems.push(`${account.name}: ${leadsRes.error.message}`);
      continue;
    }

    for (const lead of leadsRes.data) {
      const mapped = mapLeadFields(lead.fields);
      const attribution = {
        adAccountId: account.id,
        campaignId: lead.campaign_id ?? null,
        campaignName: lead.campaign_name ?? null,
        adSetName: lead.adset_name ?? null,
        adId: lead.ad_id ?? null,
        adName: lead.ad_name ?? null,
        formId: lead.form_id ?? null,
        platform: lead.platform ?? null,
        isOrganic: lead.is_organic ?? false,
      };

      const isNew = !known.has(lead.id);
      const id = isNew ? nextEntityId("LD", idPool) : "";

      await prisma.lead.upsert({
        where: { fbLeadId: lead.id },
        create: {
          id,
          fbLeadId: lead.id,
          ...mapped,
          ...attribution,
          rawFields: lead.fields,
          status: "New",
          createdTime: new Date(lead.created_time),
          syncedAt: new Date(),
        },
        // Refresh only what Meta owns. Status, notes and the client link belong
        // to whoever has been working the lead here and must survive a re-sync.
        update: {
          ...mapped,
          ...attribution,
          rawFields: lead.fields,
          createdTime: new Date(lead.created_time),
          syncedAt: new Date(),
        },
      });

      if (isNew) {
        known.add(lead.id);
        idPool.push({ id });
        created++;
      } else {
        updated++;
      }
    }
  }

  revalidatePath("/leads");
  revalidatePath("/marketing");

  backToLeads({
    created,
    updated,
    ads: scannedAds,
    accounts: accounts.length,
    ...(problems.length ? { warn: problems.join(" · ") } : {}),
  });
}

export async function updateLeadStatusAction(formData: FormData) {
  await requireAdmin();
  const leadId = String(formData.get("leadId") || "");
  const candidate = String(formData.get("status") || "");
  const status: LeadStatus = (LEAD_STATUSES as readonly string[]).includes(candidate)
    ? (candidate as LeadStatus)
    : "New";

  await prisma.lead.update({ where: { id: leadId }, data: { status } }).catch(() => {});
  revalidatePath("/leads");
}

export async function deleteLeadAction(formData: FormData) {
  await requireAdmin();
  const leadId = String(formData.get("leadId") || "");
  await prisma.lead.delete({ where: { id: leadId } }).catch(() => {});
  revalidatePath("/leads");
}

/**
 * Promotes a lead into a CRM client and links the two.
 *
 * The lead row stays — it is the record of where the client came from, and
 * deleting it would make the next sync recreate it as a brand-new lead.
 */
export async function convertLeadToClientAction(formData: FormData) {
  await requireAdmin();
  const leadId = String(formData.get("leadId") || "");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) redirect("/leads?error=Lead+not+found");
  if (lead.clientId) redirect(`/clients/${lead.clientId}`);

  const company = lead.companyName?.trim() || lead.fullName;

  // An existing client with the same name wins over creating a duplicate.
  const existing = await prisma.client.findFirst({
    where: { company: { equals: company, mode: "insensitive" } },
    select: { id: true },
  });

  let clientId = existing?.id;
  if (!clientId) {
    const ids = await prisma.client.findMany({ select: { id: true } });
    clientId = nextEntityId("CT", ids);
    await prisma.client.create({
      data: {
        id: clientId,
        company,
        industry: "General Contracting",
        contacts: [
          {
            id: `${clientId}-C1`,
            name: lead.fullName,
            title: "Primary contact",
            email: lead.email ?? "",
            phone: lead.phone ?? "",
          },
        ],
        address: "",
        city: "",
        state: "",
        status: "Lead",
        since: lead.createdTime,
        totalProjects: 0,
        totalInvoiced: 0,
        outstandingBalance: 0,
        communications: [
          {
            id: `${clientId}-M1`,
            date: lead.createdTime.toISOString(),
            channel: "Facebook lead form",
            note: lead.message || `Submitted the form on "${lead.campaignName ?? "a Facebook ad"}"`,
          },
        ],
      },
    });
  }

  await prisma.lead.update({ where: { id: leadId }, data: { clientId, status: "Qualified" } });

  revalidatePath("/leads");
  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}
