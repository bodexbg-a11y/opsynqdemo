import "server-only";
import { graphGetAll, type GraphError, type GraphResult } from "./client";
import type { FbAd } from "./marketing";

/** One lead-form submission, normalised out of Meta's `field_data` shape. */
export interface FbLead {
  id: string;
  created_time: string;
  form_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  platform?: string;
  is_organic?: boolean;
  fields: { name: string; value: string }[];
}

interface RawLead {
  id: string;
  created_time: string;
  field_data?: { name: string; values: string[] }[];
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  platform?: string;
  is_organic?: boolean;
}

const LEAD_FIELDS =
  "id,created_time,field_data,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,form_id,platform,is_organic";

/**
 * Graph rejects the `/leads` edge on ads that carry no lead form. That is an
 * expected, uninteresting outcome — only a genuine auth/permission failure is
 * worth surfacing to the user.
 */
function isMissingEdgeError(error: GraphError): boolean {
  return error.code === 100 || error.status === 400;
}

/** Runs `worker` over `items` with a bounded number of requests in flight. */
async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

export interface CollectLeadsOptions {
  /** Cap on how many ads get probed. Page renders bound this; the sync does not. */
  maxAds?: number;
  /** Pages of 100 leads to walk per ad. */
  maxPagesPerAd?: number;
  /** Parallel Graph requests. Kept low so Meta does not rate-limit the app. */
  concurrency?: number;
}

/**
 * Walks the `/leads` edge of every supplied ad and returns the submissions.
 *
 * Leads hang off ads, not off the ad account, so there is no single endpoint
 * that returns them all — every ad has to be asked. `maxAds` exists only to
 * keep page rendering bounded; the CRM sync passes the full list.
 */
export async function collectLeads(
  token: string,
  ads: FbAd[],
  { maxAds = Infinity, maxPagesPerAd = 5, concurrency = 5 }: CollectLeadsOptions = {}
): Promise<GraphResult<FbLead[]>> {
  const candidates = Number.isFinite(maxAds) ? ads.slice(0, maxAds) : ads;
  if (!candidates.length) return { ok: true, data: [] };

  let authError: GraphError | null = null;

  const perAd = await mapLimit(candidates, concurrency, async (ad) => {
    const result = await graphGetAll<RawLead>(`${ad.id}/leads`, { fields: LEAD_FIELDS }, token, maxPagesPerAd);
    if (!result.ok) {
      // A permission or token problem is real; "this ad has no lead form" is not.
      if (!isMissingEdgeError(result.error)) authError = result.error;
      return [] as FbLead[];
    }
    return result.data.map((raw) => ({
      id: raw.id,
      created_time: raw.created_time,
      form_id: raw.form_id,
      campaign_id: raw.campaign_id ?? ad.campaign_id,
      campaign_name: raw.campaign_name,
      adset_name: raw.adset_name,
      ad_id: raw.ad_id ?? ad.id,
      ad_name: raw.ad_name ?? ad.name,
      platform: raw.platform,
      is_organic: raw.is_organic,
      fields: (raw.field_data ?? []).map((f) => ({ name: f.name, value: f.values?.[0] ?? "" })),
    }));
  });

  const leads = perAd.flat();

  // Only fail when nothing came back at all — one broken ad shouldn't discard
  // the leads that other ads returned successfully.
  if (!leads.length && authError) return { ok: false, error: authError };

  leads.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
  return { ok: true, data: leads };
}

/* ── Field mapping ─────────────────────────────────────────────────────────── */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s\-().]{6,}$/;

function findField(fields: { name: string; value: string }[], exact: string[], contains: string[]): string {
  for (const key of exact) {
    const hit = fields.find((f) => norm(f.name) === key && f.value.trim());
    if (hit) return hit.value.trim();
  }
  for (const key of contains) {
    const hit = fields.find((f) => norm(f.name).includes(key) && f.value.trim());
    if (hit) return hit.value.trim();
  }
  return "";
}

export interface MappedLead {
  fullName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  message: string | null;
}

/**
 * Meta lead forms have no fixed schema: the standard questions come back as
 * `full_name` / `email` / `phone_number`, but custom questions carry whatever
 * the advertiser typed. Match the known names first, then fall back to
 * recognising the value itself.
 */
export function mapLeadFields(fields: { name: string; value: string }[]): MappedLead {
  const first = findField(fields, ["firstname"], []);
  const last = findField(fields, ["lastname"], []);
  const fullName =
    findField(fields, ["fullname", "name"], []) ||
    [first, last].filter(Boolean).join(" ") ||
    findField(fields, [], ["name"]) ||
    "Unnamed lead";

  const email =
    findField(fields, ["email", "workemail"], ["email"]) || fields.find((f) => EMAIL_RE.test(f.value.trim()))?.value.trim() || "";

  const phone =
    findField(fields, ["phonenumber", "phone", "workphonenumber"], ["phone", "mobile", "tel"]) ||
    fields.find((f) => PHONE_RE.test(f.value.trim()) && !EMAIL_RE.test(f.value.trim()))?.value.trim() ||
    "";

  const companyName = findField(fields, ["companyname", "company"], ["company", "organisation", "organization"]);
  const message = findField(fields, [], ["message", "comment", "detail", "describe", "question", "project"]);

  return {
    fullName,
    email: email || null,
    phone: phone || null,
    companyName: companyName || null,
    message: message || null,
  };
}
