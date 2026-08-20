import "server-only";
import { prisma } from "../db";
import { SETTINGS_ID } from "../settings";

/**
 * Graph API version. Meta supports each version for ~2 years; override with
 * FACEBOOK_API_VERSION if this one is retired or you need a newer field.
 */
export const GRAPH_VERSION = process.env.FACEBOOK_API_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/** Shape Meta returns on failure. */
export interface GraphError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  /** HTTP status, when the failure came back as a non-2xx response. */
  status?: number;
}

export type GraphResult<T> = { ok: true; data: T } | { ok: false; error: GraphError };

interface Paged<T> {
  data: T[];
  paging?: { next?: string; cursors?: { before?: string; after?: string } };
}

/**
 * The access token, preferring the one saved in Settings so it can be rotated
 * without a redeploy, falling back to the environment variable.
 */
export async function getFacebookToken(): Promise<string | null> {
  const row = await prisma.appSettings
    .findUnique({ where: { id: SETTINGS_ID }, select: { facebookAccessToken: true } })
    .catch(() => null);
  return row?.facebookAccessToken?.trim() || process.env.FACEBOOK_ACCESS_TOKEN?.trim() || null;
}

/** Turns anything thrown or returned by Meta into a consistent GraphError. */
function toGraphError(status: number, body: unknown): GraphError {
  const err = (body as { error?: Record<string, unknown> } | null)?.error;
  if (err && typeof err === "object") {
    return {
      message: String(err.message ?? "Unknown Graph API error"),
      type: err.type ? String(err.type) : undefined,
      code: typeof err.code === "number" ? err.code : undefined,
      error_subcode: typeof err.error_subcode === "number" ? err.error_subcode : undefined,
      fbtrace_id: err.fbtrace_id ? String(err.fbtrace_id) : undefined,
      status,
    };
  }
  return { message: `Graph API returned HTTP ${status}`, status };
}

/** Single Graph API GET. Never throws — failures come back as `{ ok: false }`. */
export async function graphGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  token: string
): Promise<GraphResult<T>> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  search.set("access_token", token);

  const url = `${GRAPH_BASE}/${path.replace(/^\//, "")}?${search.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Ad data changes slowly and every page view would otherwise hit Meta's
      // rate limits; 5 minutes keeps the dashboard responsive and fresh enough.
      next: { revalidate: 300 },
    });

    const body = await response.json().catch(() => null);
    if (!response.ok || (body && typeof body === "object" && "error" in body)) {
      return { ok: false, error: toGraphError(response.status, body) };
    }
    return { ok: true, data: body as T };
  } catch (cause) {
    return {
      ok: false,
      error: { message: cause instanceof Error ? cause.message : "Network request to Facebook failed" },
    };
  }
}

/**
 * Graph API GET that follows `paging.next` cursors.
 * `maxPages` bounds the walk so a huge account can't stall a page render.
 */
export async function graphGetAll<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  token: string,
  maxPages = 5
): Promise<GraphResult<T[]>> {
  const first = await graphGet<Paged<T>>(path, { limit: 100, ...params }, token);
  if (!first.ok) return first;

  const items = [...(first.data.data ?? [])];
  let next = first.data.paging?.next;

  for (let page = 1; page < maxPages && next; page++) {
    try {
      // `paging.next` is a fully-formed URL with its own token and cursor.
      const response = await fetch(next, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
      const body = await response.json().catch(() => null);
      if (!response.ok || (body && typeof body === "object" && "error" in body)) break;
      const paged = body as Paged<T>;
      items.push(...(paged.data ?? []));
      next = paged.paging?.next;
    } catch {
      break; // Partial data beats failing the whole page.
    }
  }

  return { ok: true, data: items };
}

/** Human-readable hint for the Graph error codes this integration hits most. */
export function explainGraphError(error: GraphError): string {
  if (error.code === 190) {
    return "The access token is invalid or has expired. Generate a new one and paste it in Settings → Integrations.";
  }
  if (error.code === 200 || error.code === 10) {
    return "The token is missing a required permission. It needs ads_read (and leads_retrieval for lead records).";
  }
  if (error.code === 4 || error.code === 17 || error.code === 613) {
    return "Facebook is rate-limiting this app. Wait a few minutes and reload.";
  }
  if (error.code === 100) {
    return "Facebook rejected a field or parameter — this usually means the API version needs updating (set FACEBOOK_API_VERSION).";
  }
  if (error.code === 2635) {
    return `Graph API ${GRAPH_VERSION} is no longer supported. Set FACEBOOK_API_VERSION to a current version.`;
  }
  // No Meta error code means the response never came from Meta — something
  // between this server and graph.facebook.com answered instead.
  if (error.code === undefined && error.status !== undefined && [403, 407, 502, 503].includes(error.status)) {
    return "The request never reached Facebook — a proxy or firewall blocked it. Check outbound access to graph.facebook.com.";
  }
  return "Check the Graph API message for details.";
}
