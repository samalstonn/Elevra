const PRIVATE_IP_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

export interface LocationLookupResult {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  label: string;
  source: "ipinfo" | "private" | "unknown";
}

const locationCache = new Map<string, LocationLookupResult>();

function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const first = ip.split(",")[0]?.trim();
  if (!first) return null;
  return first;
}

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(ip));
}

export async function lookupLocationForIp(
  rawIp: string | null | undefined
): Promise<LocationLookupResult> {
  const ip = normalizeIp(rawIp);
  if (!ip) {
    return {
      label: "Unknown Location",
      source: "unknown",
    };
  }

  const cached = locationCache.get(ip);
  if (cached) {
    return cached;
  }

  if (isPrivateIp(ip)) {
    const result: LocationLookupResult = {
      label: "Private Network",
      source: "private",
    };
    locationCache.set(ip, result);
    return result;
  }

  const token = process.env.IPINFO_TOKEN;
  if (!token) {
    const result: LocationLookupResult = {
      label: "Unknown Location",
      source: "unknown",
    };
    locationCache.set(ip, result);
    return result;
  }

  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
    if (!response.ok) {
      throw new Error(`IP info fetch failed with status ${response.status}`);
    }
    const data = (await response.json()) as {
      city?: string;
      region?: string;
      country?: string;
    };

    const city = data.city?.trim() || null;
    const region = data.region?.trim() || null;
    const country = data.country?.trim() || null;

    const pieces = [city, region, country].filter(Boolean);
    const label = pieces.length > 0 ? pieces.join(", ") : "Unknown Location";

    const result: LocationLookupResult = {
      city,
      region,
      country,
      label,
      source: "ipinfo",
    };
    locationCache.set(ip, result);
    return result;
  } catch (error) {
    console.error("lookupLocationForIp error", error);
    const result: LocationLookupResult = {
      label: "Unknown Location",
      source: "unknown",
    };
    locationCache.set(ip, result);
    return result;
  }
}
