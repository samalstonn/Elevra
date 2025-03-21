export function normalizeSlug(str: string): string {
    return str.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, "-").trim();
  }
  