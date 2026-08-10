import { generateStore, type Store } from "./generate";
import { readOverlay, mergeCollection, type OverlayKind } from "./overlay";

let cached: Store | null = null;

function baseStore(): Store {
  if (!cached) {
    cached = generateStore(1337);
  }
  return cached;
}

const OVERLAY_KINDS: [OverlayKind, keyof Store][] = [
  ["project", "projects"],
  ["team", "teams"],
  ["task", "tasks"],
  ["equipment", "equipment"],
  ["material", "materials"],
  ["client", "clients"],
  ["employee", "employees"],
];

/**
 * Returns the deterministic demo dataset merged with this visitor's session overlay (see
 * `./overlay`). Never mutates the shared base store — each call returns a fresh object so
 * one visitor's session data can't leak into another's.
 */
export async function getStore(): Promise<Store> {
  const base = baseStore();
  const overlay = await readOverlay();

  const merged: Store = { ...base };
  for (const [kind, key] of OVERLAY_KINDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (merged as any)[key] = mergeCollection(kind, base[key] as { id: string }[], overlay);
  }
  return merged;
}
