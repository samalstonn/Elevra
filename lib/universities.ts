// Lightweight wrapper for the public Hipolabs Universities API
// https://universities.hipolabs.com/

export type University = {
  name: string;
  country: string;
  alpha_two_code?: string;
  "state-province"?: string | null;
  domains?: string[];
  web_pages?: string[];
};

export type UniversityQuery = {
  name?: string;
  country?: string; // Country name, e.g. "United States" or ISO code via alpha_two_code filter (not directly supported by API)
  signal?: AbortSignal;
};

const BASE_URL = "https://universities.hipolabs.com/search" as const;

// Server-friendly fetcher; can be used in Route Handlers or server components.
export async function fetchUniversities({
  name,
  country,
  signal,
}: UniversityQuery = {}): Promise<University[]> {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (country) params.set("country", country);

  const url = `${BASE_URL}?${params.toString()}`;

  const res = await fetch(url, {
    signal,
    // Allow CDN caching when used in Next route handlers
    next: { revalidate: 60 * 60 * 24 }, // 24h
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Universities API request failed: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as University[];
  // Basic normalization to ensure optional arrays exist
  return data.map((u) => ({
    ...u,
    domains: u.domains ?? [],
    web_pages: u.web_pages ?? [],
    "state-province": u["state-province"] ?? null,
  }));
}
