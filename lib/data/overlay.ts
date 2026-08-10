// Persists demo-session mutations (new projects/teams/tasks/etc. and field edits) in a
// browser cookie. This app has no real database — its "store" is a deterministic in-memory
// object rebuilt from a fixed seed on every server instance. On serverless hosting (Vercel)
// that object is NOT shared across instances, so a change made in one request can be
// invisible to the very next request. The cookie is the one thing that reliably travels
// with the user's browser regardless of which instance handles a given request, so it's
// used here as a lightweight per-visitor overlay on top of the deterministic base data.
import { cookies } from "next/headers";
import type { Project, Team, Task, Equipment, Material, Client } from "./types";

export type OverlayKind = "project" | "team" | "task" | "equipment" | "material" | "client" | "employee";

export interface Overlay {
  projects: Project[];
  teams: Team[];
  tasks: Task[];
  equipment: Equipment[];
  materials: Material[];
  clients: Client[];
  patches: Record<string, Record<string, unknown>>;
  // Insertion order across every array + patch key, oldest first — used to evict the
  // oldest entries if the cookie ever grows past the browser's per-cookie size limit.
  // ("employee" never appears here — employees are patch-only, see `patchEntity`.)
  order: { kind: Exclude<OverlayKind, "employee"> | "patch"; key: string }[];
}

const COOKIE_NAME = "opsynq_overlay";
// Next's cookie serializer percent-encodes the value for us (reserved JSON characters like
// `"` `{` `:` each become a 3-byte escape), so the ~2400-char raw-JSON budget below lands
// comfortably under the browser's ~4KB per-cookie ceiling once encoded on the wire.
const MAX_COOKIE_CHARS = 2400;

function emptyOverlay(): Overlay {
  return { projects: [], teams: [], tasks: [], equipment: [], materials: [], clients: [], patches: {}, order: [] };
}

const ARRAY_KEY: Record<Exclude<OverlayKind, "employee">, keyof Overlay> = {
  project: "projects",
  team: "teams",
  task: "tasks",
  equipment: "equipment",
  material: "materials",
  client: "clients",
};

export async function readOverlay(): Promise<Overlay> {
  const jar = await cookies();
  // Next's ResponseCookies/RequestCookies already percent-encode/decode the value for us —
  // encoding it again here would double-encode it and blow the real per-cookie size budget.
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return emptyOverlay();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyOverlay(), ...parsed };
  } catch {
    return emptyOverlay();
  }
}

function serialize(overlay: Overlay): string {
  return JSON.stringify(overlay);
}

function evictOldest(overlay: Overlay) {
  const oldest = overlay.order.shift();
  if (!oldest) return;
  if (oldest.kind === "patch") {
    delete overlay.patches[oldest.key];
    return;
  }
  const arrayKey = ARRAY_KEY[oldest.kind];
  const arr = overlay[arrayKey] as { id: string }[];
  const idx = arr.findIndex((item) => item.id === oldest.key);
  if (idx !== -1) arr.splice(idx, 1);
}

/** Adds a brand-new entity created during this session (e.g. a project made via the "New Project" form). */
export function addEntity<K extends Exclude<OverlayKind, "employee">>(
  overlay: Overlay,
  kind: K,
  entity: K extends "project" ? Project : K extends "team" ? Team : K extends "task" ? Task : K extends "equipment" ? Equipment : K extends "material" ? Material : Client
) {
  const arrayKey = ARRAY_KEY[kind];
  (overlay[arrayKey] as { id: string }[]).push(entity as unknown as { id: string });
  overlay.order.push({ kind, key: (entity as unknown as { id: string }).id });
}

/** Records a field-level edit to an entity that may live in the deterministic base data or in this overlay. */
export function patchEntity(overlay: Overlay, kind: OverlayKind, id: string, patch: Record<string, unknown>) {
  const key = `${kind}:${id}`;
  const existing = overlay.patches[key];
  overlay.patches[key] = { ...existing, ...patch };
  if (!existing) overlay.order.push({ kind: "patch", key });
}

/** Reads the current overlay, applies `mutate`, and writes the (possibly trimmed) result back to the cookie. */
export async function writeOverlay(mutate: (overlay: Overlay) => void) {
  const overlay = await readOverlay();
  mutate(overlay);

  let serialized = serialize(overlay);
  // Extremely defensive: a long-running demo session that creates dozens of records could
  // in theory outgrow a single cookie. Drop the oldest overlay entries rather than fail the
  // write outright — recent activity (what the visitor is actively looking at) wins.
  while (serialized.length > MAX_COOKIE_CHARS && overlay.order.length > 0) {
    evictOldest(overlay);
    serialized = serialize(overlay);
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, serialized, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Applies the overlay's additions and patches on top of a base collection, without mutating it. */
export function mergeCollection<T extends { id: string }>(kind: OverlayKind, base: T[], overlay: Overlay): T[] {
  const applyPatch = (item: T): T => {
    const patch = overlay.patches[`${kind}:${item.id}`];
    return patch ? ({ ...item, ...patch } as T) : item;
  };
  const merged = base.map(applyPatch);
  if (kind === "employee") return merged; // employees are patch-only, never created via overlay
  const arrayKey = ARRAY_KEY[kind as Exclude<OverlayKind, "employee">];
  const additions = overlay[arrayKey] as unknown as T[];
  const existingIds = new Set(base.map((item) => item.id));
  for (const item of additions) {
    if (!existingIds.has(item.id)) merged.push(applyPatch(item));
  }
  return merged;
}

