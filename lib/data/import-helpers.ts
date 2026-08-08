export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type ImportRow = Record<string, unknown>;

export function pick(row: ImportRow, headerMap: Map<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const original = headerMap.get(alias);
    if (original !== undefined) {
      const value = row[original];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return cellToString(value);
      }
    }
  }
  return "";
}

export function cellToString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "text" in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text ?? "");
  }
  if (typeof value === "object" && value !== null && "result" in (value as Record<string, unknown>)) {
    return String((value as { result: unknown }).result ?? "");
  }
  return String(value).trim();
}

export function parseNumber(value: string, fallback = 0): number {
  if (!value) return fallback;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

export function parseDateOrDefault(value: string, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export function matchEnum<T extends string>(value: string, options: readonly T[], fallback: T): T {
  const found = options.find((o) => o.toLowerCase() === value.trim().toLowerCase());
  return found ?? fallback;
}
