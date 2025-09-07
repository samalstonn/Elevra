export type EducationEntry = {
  name: string;
  country: string;
  stateProvince?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  degree?: string | null;
  graduationYear?: string | null;
  activities?: string | null;
};

const PREFIX = "edu|" as const;

export function encodeEducation(e: EducationEntry): string {
  const parts = [
    e.name ?? "",
    e.country ?? "",
    e.stateProvince ?? "",
    e.city ?? "",
    e.state ?? "",
    e.website ?? "",
    e.degree ?? "",
    e.graduationYear ?? "",
    e.activities ?? "",
  ];
  return PREFIX + parts.map((p) => p.replace(/\|/g, "/")).join("|");
}

export function decodeEducation(s: string): EducationEntry | null {
  if (!s.startsWith(PREFIX)) return null;
  const body = s.slice(PREFIX.length);
  const parts = body.split("|");
  if (parts.length <= 4) {
    // v1 entries: name|country|stateProvince|website
    const [name, country, stateProvince, website] = parts;
    return {
      name: name || "",
      country: country || "",
      stateProvince: stateProvince || null,
      city: null,
      state: null,
      website: website || null,
      degree: null,
      graduationYear: null,
      activities: null,
    };
  }
  const [
    name,
    country,
    stateProvince,
    city,
    state,
    website,
    degree,
    graduationYear,
    activities,
  ] = parts;
  return {
    name: name || "",
    country: country || "",
    stateProvince: stateProvince || null,
    city: city || null,
    state: state || null,
    website: website || null,
    degree: degree || null,
    graduationYear: graduationYear || null,
    activities: activities || null,
  };
}

export function extractEducation(
  history: string[] | null | undefined
): EducationEntry[] {
  if (!history || history.length === 0) return [];
  return history
    .map(decodeEducation)
    .filter((e): e is EducationEntry => !!e && !!e.name && !!e.country);
}
