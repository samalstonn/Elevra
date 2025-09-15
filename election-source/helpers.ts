export function normalizeHeader(h: string): string {
  return h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

// Read a value from a raw row by matching any header variant (case/spacing-insensitive)
export function getRawValue(
  raw: Record<string, unknown>,
  variants: string[]
): string {
  const want = new Set(variants.map((v) => normalizeHeader(v)));
  for (const k of Object.keys(raw)) {
    if (want.has(normalizeHeader(k))) {
      const v = raw[k];
      if (typeof v === "string") return v;
      if (typeof v === "number") return String(v);
    }
  }
  return "";
}

// Validate candidate emails: presence, uniqueness, basic format
export function validateEmails(
  rows: Array<{ email: string }>
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  rows.forEach((r, i) => {
    const raw = (r.email || "").trim();
    const val = raw.toLowerCase();
    const rowNo = i + 1;
    if (!val) {
      errors.push(`Row ${rowNo}: missing email`);
      return;
    }
    if (!emailRe.test(val)) {
      errors.push(`Row ${rowNo}: invalid email '${raw}'`);
      return;
    }
    if (seen.has(val)) {
      errors.push(`Row ${rowNo}: duplicate email '${raw}'`);
      return;
    }
    seen.add(val);
  });
  return { ok: errors.length === 0, errors };
}
