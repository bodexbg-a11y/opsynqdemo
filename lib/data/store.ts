import { generateStore, type Store } from "./generate";

let cached: Store | null = null;

export function getStore(): Store {
  if (!cached) {
    cached = generateStore(1337);
  }
  return cached;
}
