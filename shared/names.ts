export function cleanName(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.replace(/[^\p{L}\p{N} '\-]/gu, "").trim().slice(0, 16);
  return trimmed || fallback;
}

export function cleanCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return code.length === 4 ? code : null;
}
