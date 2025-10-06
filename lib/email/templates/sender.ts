const NAME_KEYS = [
  "outreachsignaturename",
  "signaturename",
  "sendername",
  "signaturefrom",
];

const TAGLINE_KEYS = [
  "outreachsignaturetitle",
  "outreachsignaturetagline",
  "signaturesubtitle",
  "signaturetitle",
  "signaturetagline",
  "signatureline",
  "signaturesuffix",
  "classyear",
  "classyeartagline",
  "affiliationtagline",
  "affiliation",
  "tagline",
  "titleline",
  "yeartagline",
  "cornellyear",
];

const LINKEDIN_URL_KEYS = [
  "outreachlinkedinurl",
  "outreachlinkedin",
  "linkedinurl",
  "linkedin",
  "linkedinprofile",
  "linkedinhandle",
  "linkedinlink",
];

const LINKEDIN_LABEL_KEYS = [
  "outreachlinkedinlabel",
  "linkedinlabel",
  "outreachlinkedintext",
  "linkedintext",
  "linkedincta",
];

const DEFAULT_LINKEDIN_LABEL = "LinkedIn";

export type SenderFields = {
  senderName?: string;
  senderTitle?: string;
  senderLinkedInUrl?: string;
  senderLinkedInLabel?: string;
};

type MinimalEmailAddress = { emailAddress?: string | null } | null | undefined;

type MinimalUser = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  publicMetadata?: Record<string, unknown> | null;
  primaryEmailAddress?: MinimalEmailAddress;
  emailAddresses?: MinimalEmailAddress[] | null;
};

function normalizeMetadata(
  metadata: Record<string, unknown> | null | undefined
): Map<string, string> {
  const map = new Map<string, string>();
  if (!metadata) return map;
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") {
      const normalizedKey = key.trim().toLowerCase();
      const normalizedValue = value.trim();
      if (normalizedKey && normalizedValue && !map.has(normalizedKey)) {
        map.set(normalizedKey, normalizedValue);
      }
    }
  }
  return map;
}

function lookup(map: Map<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const match = map.get(key);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function buildNameFromUser(user: MinimalUser | null | undefined): string | undefined {
  if (!user) return undefined;
  const metadataMap = normalizeMetadata(user.publicMetadata);
  const metadataName = lookup(metadataMap, NAME_KEYS);
  if (metadataName) return metadataName;

  const parts = [user.firstName, user.lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  if (typeof user.username === "string" && user.username.trim()) {
    return user.username.trim();
  }
  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  if (typeof primaryEmail === "string" && primaryEmail.trim()) {
    return primaryEmail.trim();
  }
  const firstOtherEmail = user.emailAddresses?.find(
    (address) => typeof address?.emailAddress === "string" && address.emailAddress.trim()
  );
  const otherEmail = firstOtherEmail?.emailAddress;
  if (typeof otherEmail === "string" && otherEmail.trim()) {
    return otherEmail.trim();
  }
  return undefined;
}

function buildTitleFromMetadata(map: Map<string, string>): string | undefined {
  const raw = lookup(map, TAGLINE_KEYS);
  if (!raw) return undefined;
  const includesElevra = /elevra/i.test(raw);
  if (includesElevra) {
    return raw;
  }
  return `Elevra | ${raw}`;
}

function buildLinkedInUrl(map: Map<string, string>): string | undefined {
  const raw = lookup(map, LINKEDIN_URL_KEYS);
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return `https://${raw}`;
}

function buildLinkedInLabel(
  map: Map<string, string>,
  hasUrl: boolean
): string | undefined {
  const raw = lookup(map, LINKEDIN_LABEL_KEYS);
  if (raw) return raw;
  if (hasUrl) return DEFAULT_LINKEDIN_LABEL;
  return undefined;
}

export function deriveSenderFields(user: MinimalUser | null | undefined): SenderFields {
  if (!user) return {};
  const metadataMap = normalizeMetadata(user.publicMetadata);
  const senderName = buildNameFromUser(user);
  const senderTitle = buildTitleFromMetadata(metadataMap);
  const senderLinkedInUrl = buildLinkedInUrl(metadataMap);
  const senderLinkedInLabel = buildLinkedInLabel(
    metadataMap,
    Boolean(senderLinkedInUrl)
  );

  const fields: SenderFields = {};
  if (senderName) fields.senderName = senderName;
  if (senderTitle) fields.senderTitle = senderTitle;
  if (senderLinkedInUrl) fields.senderLinkedInUrl = senderLinkedInUrl;
  if (senderLinkedInLabel) fields.senderLinkedInLabel = senderLinkedInLabel;
  return fields;
}
