import "server-only";
import { graphGet, graphGetAll, getFacebookToken, type GraphError, type GraphResult } from "./client";

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface FbAdAccount {
  id: string; // "act_123..."
  account_id: string;
  name: string;
  currency: string;
  account_status: number;
  amount_spent?: string;
  balance?: string;
  business_name?: string;
  timezone_name?: string;
}

export interface FbCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective?: string;
  buying_type?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time?: string;
}

export interface FbAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
  billing_event?: string;
  start_time?: string;
  end_time?: string;
}

export interface FbAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  creative?: { id?: string; thumbnail_url?: string; title?: string; body?: string };
}

interface FbAction {
  action_type: string;
  value: string;
}

interface FbInsightRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: FbAction[];
  action_values?: FbAction[];
  cost_per_action_type?: FbAction[];
  date_start?: string;
  date_stop?: string;
}

/** Insight metrics normalised to numbers, per campaign or account-wide. */
export interface FbMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  frequency: number;
  leads: number;
  conversions: number;
  conversionValue: number;
  costPerLead: number;
  roas: number;
}

export interface FbCampaignRow extends FbCampaign {
  metrics: FbMetrics;
}

export interface FbLead {
  id: string;
  created_time: string;
  form_id?: string;
  form_name?: string;
  campaign_name?: string;
  ad_name?: string;
  fields: { name: string; value: string }[];
}

export interface FacebookSnapshot {
  account: FbAdAccount;
  totals: FbMetrics;
  campaigns: FbCampaignRow[];
  adSets: FbAdSet[];
  ads: FbAd[];
  leads: FbLead[];
  /** Non-fatal problems (e.g. leads unavailable) shown as warnings in the UI. */
  warnings: string[];
  datePreset: string;
}

/* ── Metric normalisation ──────────────────────────────────────────────────── */

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Action types Meta uses for lead-gen conversions, in priority order. */
const LEAD_ACTIONS = ["lead", "leadgen.other", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];
const PURCHASE_ACTIONS = ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"];

function sumActions(actions: FbAction[] | undefined, types: string[]): number {
  if (!actions?.length) return 0;
  // Meta reports overlapping action types; take the first that's present rather
  // than summing, or a single lead gets counted several times.
  for (const type of types) {
    const hit = actions.find((a) => a.action_type === type);
    if (hit) return num(hit.value);
  }
  return 0;
}

function totalConversions(actions: FbAction[] | undefined): number {
  const purchases = sumActions(actions, PURCHASE_ACTIONS);
  const leads = sumActions(actions, LEAD_ACTIONS);
  return purchases + leads;
}

function toMetrics(row: FbInsightRow | undefined): FbMetrics {
  const spend = num(row?.spend);
  const leads = sumActions(row?.actions, LEAD_ACTIONS);
  const conversionValue = sumActions(row?.action_values, PURCHASE_ACTIONS);
  return {
    spend,
    impressions: num(row?.impressions),
    clicks: num(row?.clicks),
    ctr: num(row?.ctr),
    cpc: num(row?.cpc),
    cpm: num(row?.cpm),
    reach: num(row?.reach),
    frequency: num(row?.frequency),
    leads,
    conversions: totalConversions(row?.actions),
    conversionValue,
    costPerLead: leads > 0 ? spend / leads : 0,
    roas: spend > 0 ? conversionValue / spend : 0,
  };
}

const EMPTY_METRICS: FbMetrics = toMetrics(undefined);

function addMetrics(a: FbMetrics, b: FbMetrics): FbMetrics {
  const spend = a.spend + b.spend;
  const impressions = a.impressions + b.impressions;
  const clicks = a.clicks + b.clicks;
  const leads = a.leads + b.leads;
  const conversionValue = a.conversionValue + b.conversionValue;
  return {
    spend,
    impressions,
    clicks,
    // Derived rates must be recomputed from the totals, never averaged.
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    reach: a.reach + b.reach,
    frequency: 0, // Not additive across campaigns — shown per-campaign only.
    leads,
    conversions: a.conversions + b.conversions,
    conversionValue,
    costPerLead: leads > 0 ? spend / leads : 0,
    roas: spend > 0 ? conversionValue / spend : 0,
  };
}

const INSIGHT_FIELDS =
  "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,cost_per_action_type";

/* ── Fetchers ──────────────────────────────────────────────────────────────── */

/** Lists every ad account the token can see. */
export async function fetchAdAccounts(token: string): Promise<GraphResult<FbAdAccount[]>> {
  return graphGetAll<FbAdAccount>(
    "me/adaccounts",
    { fields: "id,account_id,name,currency,account_status,amount_spent,balance,business_name,timezone_name" },
    token
  );
}

/** Verifies a token and reports who it belongs to. */
export async function fetchTokenIdentity(token: string): Promise<GraphResult<{ id: string; name?: string }>> {
  return graphGet<{ id: string; name?: string }>("me", { fields: "id,name" }, token);
}

/**
 * Pulls everything the Marketing page shows for one ad account.
 * Sub-resources that fail (commonly leads, which needs extra permissions)
 * degrade into warnings rather than failing the whole page.
 */
export async function fetchAccountSnapshot(
  token: string,
  account: FbAdAccount,
  datePreset = "last_30d"
): Promise<GraphResult<FacebookSnapshot>> {
  const actPath = account.id.startsWith("act_") ? account.id : `act_${account.id}`;
  const warnings: string[] = [];

  const [campaignsRes, campaignInsightsRes, accountInsightsRes, adSetsRes, adsRes] = await Promise.all([
    graphGetAll<FbCampaign>(
      `${actPath}/campaigns`,
      {
        fields:
          "id,name,status,effective_status,objective,buying_type,daily_budget,lifetime_budget,start_time,stop_time,created_time",
      },
      token
    ),
    graphGetAll<FbInsightRow>(
      `${actPath}/insights`,
      { level: "campaign", fields: INSIGHT_FIELDS, date_preset: datePreset },
      token
    ),
    graphGetAll<FbInsightRow>(`${actPath}/insights`, { level: "account", fields: INSIGHT_FIELDS, date_preset: datePreset }, token),
    graphGetAll<FbAdSet>(
      `${actPath}/adsets`,
      {
        fields: "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,start_time,end_time",
      },
      token
    ),
    graphGetAll<FbAd>(
      `${actPath}/ads`,
      { fields: "id,name,adset_id,campaign_id,status,effective_status,creative{id,thumbnail_url,title,body}" },
      token
    ),
  ]);

  // Campaigns are the backbone of the page — if that call fails, so does the page.
  if (!campaignsRes.ok) return campaignsRes;

  if (!campaignInsightsRes.ok) warnings.push(`Campaign performance unavailable: ${campaignInsightsRes.error.message}`);
  if (!adSetsRes.ok) warnings.push(`Ad sets unavailable: ${adSetsRes.error.message}`);
  if (!adsRes.ok) warnings.push(`Ads unavailable: ${adsRes.error.message}`);

  const insightsByCampaign = new Map<string, FbInsightRow>();
  if (campaignInsightsRes.ok) {
    for (const row of campaignInsightsRes.data) {
      if (row.campaign_id) insightsByCampaign.set(row.campaign_id, row);
    }
  }

  const campaigns: FbCampaignRow[] = campaignsRes.data.map((c) => ({
    ...c,
    metrics: toMetrics(insightsByCampaign.get(c.id)),
  }));

  // Prefer Meta's own account-level rollup; fall back to summing campaigns.
  const totals =
    accountInsightsRes.ok && accountInsightsRes.data.length
      ? toMetrics(accountInsightsRes.data[0])
      : campaigns.reduce((acc, c) => addMetrics(acc, c.metrics), EMPTY_METRICS);

  const leadsRes = await fetchLeads(token, adsRes.ok ? adsRes.data : []);
  if (!leadsRes.ok) {
    warnings.push(`Lead records unavailable: ${leadsRes.error.message} (needs the leads_retrieval permission)`);
  }

  return {
    ok: true,
    data: {
      account,
      totals,
      campaigns,
      adSets: adSetsRes.ok ? adSetsRes.data : [],
      ads: adsRes.ok ? adsRes.data : [],
      leads: leadsRes.ok ? leadsRes.data : [],
      warnings,
      datePreset,
    },
  };
}

interface RawLead {
  id: string;
  created_time: string;
  field_data?: { name: string; values: string[] }[];
  campaign_name?: string;
  ad_name?: string;
  form_id?: string;
}

/**
 * Pulls actual lead-form submissions. Requires the leads_retrieval permission,
 * so this is treated as optional enrichment on top of the lead *counts* that
 * always come through insights.
 */
async function fetchLeads(token: string, ads: FbAd[], maxAds = 10): Promise<GraphResult<FbLead[]>> {
  // Only lead-gen ads have a /leads edge; probe the most recent handful.
  const candidates = ads.slice(0, maxAds);
  if (!candidates.length) return { ok: true, data: [] };

  const leads: FbLead[] = [];
  let lastError: GraphError | null = null;

  for (const ad of candidates) {
    const result = await graphGetAll<RawLead>(
      `${ad.id}/leads`,
      { fields: "id,created_time,field_data,campaign_name,ad_name,form_id" },
      token,
      2
    );
    if (!result.ok) {
      lastError = result.error;
      continue;
    }
    for (const raw of result.data) {
      leads.push({
        id: raw.id,
        created_time: raw.created_time,
        form_id: raw.form_id,
        campaign_name: raw.campaign_name,
        ad_name: raw.ad_name ?? ad.name,
        fields: (raw.field_data ?? []).map((f) => ({ name: f.name, value: f.values?.[0] ?? "" })),
      });
    }
  }

  // Only surface an error when nothing at all came back — a single ad without a
  // lead form shouldn't look like a broken integration.
  if (!leads.length && lastError) return { ok: false, error: lastError };

  leads.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
  return { ok: true, data: leads.slice(0, 100) };
}

/* ── Page-level entry point ────────────────────────────────────────────────── */

export type FacebookState =
  | { status: "disconnected" }
  | { status: "error"; error: GraphError }
  | { status: "connected"; accounts: FbAdAccount[]; snapshot: FacebookSnapshot | null; snapshotError: GraphError | null };

/**
 * Resolves the whole Facebook view for the Marketing page in one call, so the
 * page itself stays declarative and every failure mode is representable.
 */
export async function getFacebookState(accountId?: string, datePreset = "last_30d"): Promise<FacebookState> {
  const token = await getFacebookToken();
  if (!token) return { status: "disconnected" };

  const accountsRes = await fetchAdAccounts(token);
  if (!accountsRes.ok) return { status: "error", error: accountsRes.error };

  const accounts = accountsRes.data;
  if (!accounts.length) {
    return { status: "connected", accounts, snapshot: null, snapshotError: null };
  }

  const selected = accounts.find((a) => a.id === accountId || a.account_id === accountId) ?? accounts[0];
  const snapshotRes = await fetchAccountSnapshot(token, selected, datePreset);

  return {
    status: "connected",
    accounts,
    snapshot: snapshotRes.ok ? snapshotRes.data : null,
    snapshotError: snapshotRes.ok ? null : snapshotRes.error,
  };
}

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "maximum", label: "All time" },
] as const;

/** Meta's numeric account_status codes. */
export const ACCOUNT_STATUS: Record<number, string> = {
  1: "Active",
  2: "Disabled",
  3: "Unsettled",
  7: "Pending review",
  8: "Pending closure",
  9: "In grace period",
  100: "Closed",
  101: "Pending settlement",
  201: "Any active",
  202: "Any closed",
};
