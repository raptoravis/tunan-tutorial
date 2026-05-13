export class ValidationError extends Error {
  field: string;
  constructor(field: string, message = "validation_failed") {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export function normalizeOptions(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length > 80) {
      throw new ValidationError("options", "validation_failed: option_too_long");
    }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}
