export const DEFAULT_TEMPLATE_KEYS = [
  "initial",
  "followup",
  "followup2",
  "verifiedUpdate",
] as const;

export type DefaultTemplateKey = (typeof DEFAULT_TEMPLATE_KEYS)[number];
export type TemplateKey = string;

export const EMAIL_TEMPLATE_VARIABLES: readonly string[] = [
  "greetingName",
  "claimUrl",
  "templatesUrl",
  "profileUrl",
  "profileLink",
  "ctaLabel",
  "municipalityName",
  "stateName",
  "locationFragment",
  "locationSummary",
  "locationDetail",
  "positionDescriptor",
  "positionName",
  "originalHtml",
  "senderName",
  "senderTitle",
  "senderLinkedInUrl",
  "senderLinkedInLabel",
] as const;
