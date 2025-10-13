function toTitleCase(rawValue?: string | null): string {
  const trimmed = (rawValue ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const lowerCased = trimmed.toLowerCase();

  return lowerCased.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatGreetingName(
  rawName?: string | null,
  fallback = "there"
): string {
  return toTitleCase(rawName) || fallback;
}

export function formatLocationValue(rawValue?: string | null): string {
  const trimmed = (rawValue ?? "").trim();
  if (!trimmed) {
    return "";
  }

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return toTitleCase(trimmed);
}
