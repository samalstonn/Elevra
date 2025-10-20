import fs from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { formatGreetingName, formatLocationValue } from "./formatGreetingName";
import {
  DEFAULT_TEMPLATE_KEYS,
  type DefaultTemplateKey,
  type TemplateKey,
} from "./constants";

export type EmailDocumentRecord = {
  key: TemplateKey;
  title: string;
  subjectTemplate: string;
  htmlTemplate: string;
  description?: string;
};

type RenderContextInternal = {
  cache: Map<TemplateKey, EmailDocumentRecord>;
  visited: Set<TemplateKey>;
};

export type RenderContext = RenderContextInternal;

const DEFAULT_TITLES: Record<DefaultTemplateKey, string> = {
  initial: "Candidate Outreach – Initial",
  followup: "Candidate Outreach – Follow-up",
  followup2: "Candidate Outreach – Final Reminder",
  verifiedUpdate: "Candidate Outreach – Templates Update",
};

const DEFAULT_SUBJECT_TEMPLATES: Record<DefaultTemplateKey, string> = {
  initial: "Welcome to Elevra {{greetingName}}",
  followup: "RE: Your election{{locationSummary}} is live on Elevra",
  followup2: "Final reminder: Elevra voters{{locationSummary}} are active",
  verifiedUpdate:
    "Update: Templates are back — create your Elevra page{{locationSummary}}",
};

const DEFAULT_DESCRIPTIONS: Partial<Record<DefaultTemplateKey, string>> = {
  initial:
    "Introduces Elevra. Placeholders: {{greetingName}}, {{claimUrl}}, {{locationFragment}}, {{positionDescriptor}}, {{senderName}}.",
  followup:
    "Short follow-up referencing original note. Placeholders: {{greetingName}}, {{claimUrl}}, {{locationSummary}}, {{originalHtml}}.",
  followup2:
    "Final reminder highlighting metrics. Placeholders: {{greetingName}}, {{claimUrl}}, {{locationSummary}}, {{originalHtml}}.",
  verifiedUpdate:
    "Notify candidates that templates returned. Placeholders: {{greetingName}}, {{templatesUrl}}, {{profileLink}}, {{locationFragment}}.",
};

const defaultHtmlCache = new Map<DefaultTemplateKey, string>();
const defaultTemplateKeySet = new Set<DefaultTemplateKey>(DEFAULT_TEMPLATE_KEYS);

function isDefaultTemplateKey(key: TemplateKey): key is DefaultTemplateKey {
  return defaultTemplateKeySet.has(key as DefaultTemplateKey);
}

function readTemplateFile(key: DefaultTemplateKey): string {
  const file =
    key === "initial"
      ? "initial.html"
      : key === "followup"
      ? "followup.html"
      : key === "followup2"
      ? "followup2.html"
      : "verified-update.html";
  const filePath = path.join(process.cwd(), "lib/email/templates/html", file);
  return fs.readFileSync(filePath, "utf8");
}

function loadDefaultHtml(key: DefaultTemplateKey): string {
  const cached = defaultHtmlCache.get(key);
  if (cached) return cached;
  const html = readTemplateFile(key);
  defaultHtmlCache.set(key, html);
  return html;
}

function buildDefaultDocument(key: DefaultTemplateKey): EmailDocumentRecord {
  return {
    key,
    title: DEFAULT_TITLES[key],
    subjectTemplate: DEFAULT_SUBJECT_TEMPLATES[key],
    htmlTemplate: loadDefaultHtml(key),
    description: DEFAULT_DESCRIPTIONS[key],
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function isMissingTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

async function fetchEmailDocument(
  key: TemplateKey,
  context: RenderContextInternal
): Promise<EmailDocumentRecord> {
  const cached = context.cache.get(key);
  if (cached) {
    return cached;
  }

  let existing:
    | {
        title: string;
        subjectTemplate: string;
        htmlTemplate: string;
        description: string | null;
      }
    | null = null;

  try {
    existing = await prisma.emailDocument.findUnique({
      where: { key },
      select: {
        title: true,
        subjectTemplate: true,
        htmlTemplate: true,
        description: true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      if (isDefaultTemplateKey(key)) {
        const defaults = buildDefaultDocument(key);
        context.cache.set(key, { ...defaults });
        return defaults;
      }
      return {
        key,
        title: key,
        subjectTemplate: "",
        htmlTemplate: "",
        description: undefined,
      };
    }
    throw error;
  }

  let record: EmailDocumentRecord;
  if (existing) {
    record = {
      key,
      title: existing.title,
      subjectTemplate: existing.subjectTemplate,
      htmlTemplate: existing.htmlTemplate,
      description: existing.description ?? undefined,
    };
  } else if (isDefaultTemplateKey(key)) {
    const defaults = buildDefaultDocument(key);
    record = { ...defaults };
    try {
      await prisma.emailDocument.create({
        data: {
          key,
          title: defaults.title,
          subjectTemplate: defaults.subjectTemplate,
          htmlTemplate: defaults.htmlTemplate,
          description: defaults.description,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error) || isMissingTableError(error)) {
        // ignore duplicates or missing table in lower environments
      } else {
        console.error("Failed to seed default email document", {
          key,
          error,
        });
      }
    }
  } else {
    throw new Error(`Email template "${key}" was not found.`);
  }

  context.cache.set(key, record);
  return record;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match: string, token: string) => {
      const value = vars[token];
      return value != null ? value : "";
    }
  );
}

function normalizeSubject(subject: string): string {
  return subject
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+!/g, "!")
    .replace(/\s+\?/g, "?")
    .replace(/\s+;/g, ";")
    .replace(/\s+:/g, ":")
    .trim();
}

function sanitizeUrl(value: string): string {
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

function normalizeString(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

const DEFAULT_SENDER_NAME = "Adam Rose";
const DEFAULT_SENDER_TITLE = "Elevra | Cornell ’25";
const DEFAULT_SENDER_LINKEDIN_URL =
  "https://www.linkedin.com/company/elevracommunity/posts/?feedView=all";
const DEFAULT_SENDER_LINKEDIN_LABEL = "LinkedIn";

export type RenderInput = {
  candidateFirstName?: string;
  state?: string;
  claimUrl?: string;
  templatesUrl?: string;
  profileUrl?: string;
  ctaLabel?: string;
  municipality?: string;
  position?: string;
  senderName?: string;
  senderTitle?: string;
  senderLinkedInUrl?: string;
  senderLinkedInLabel?: string;
};

type RenderOptions = { baseForFollowup?: TemplateKey };

export function createEmailTemplateRenderContext(): RenderContext {
  return {
    cache: new Map<TemplateKey, EmailDocumentRecord>(),
    visited: new Set<TemplateKey>(),
  };
}

export async function renderEmailTemplate(
  key: TemplateKey,
  data: RenderInput,
  opts?: RenderOptions,
  context?: RenderContext
): Promise<{ subject: string; html: string }> {
  const ctx = context ?? createEmailTemplateRenderContext();
  if (ctx.visited.has(key)) {
    throw new Error(`Circular email template render detected for "${key}"`);
  }

  ctx.visited.add(key);
  try {
    const template = await fetchEmailDocument(key, ctx);

    const greetingName = formatGreetingName(data.candidateFirstName);
    const stateName = formatLocationValue(data.state);
    const municipalityName = formatLocationValue(data.municipality);
    const positionName = formatLocationValue(data.position);

    const locationDetail =
      municipalityName && stateName
        ? `${municipalityName}, ${stateName}`
        : municipalityName || stateName;

    const locationFragment = municipalityName
      ? `in ${municipalityName}`
      : stateName
      ? `in ${stateName}`
      : "near you";

    const locationSummary = stateName ? ` in ${stateName}` : "";
    const positionDescriptor = positionName ? `${positionName}` : "";

    const claimUrl = normalizeString(data.claimUrl);
    const templatesUrl =
      normalizeString(data.templatesUrl) || normalizeString(data.claimUrl);
    const profileUrl = normalizeString(data.profileUrl);
    const ctaLabel = normalizeString(data.ctaLabel) || "Create My Webpage";

    const rawSenderName = normalizeString(data.senderName);
    const rawSenderTitle = normalizeString(data.senderTitle);
    const rawSenderLinkedInUrl = normalizeString(data.senderLinkedInUrl);
    const rawSenderLinkedInLabel = normalizeString(data.senderLinkedInLabel);

    const senderName = rawSenderName || DEFAULT_SENDER_NAME;
    const senderTitle = rawSenderTitle || DEFAULT_SENDER_TITLE;
    const senderLinkedInUrl = rawSenderLinkedInUrl
      ? sanitizeUrl(rawSenderLinkedInUrl)
      : DEFAULT_SENDER_LINKEDIN_URL;
    const senderLinkedInLabel =
      rawSenderLinkedInLabel || DEFAULT_SENDER_LINKEDIN_LABEL;

    const replacements: Record<string, string> = {
      greetingName,
      claimUrl,
      templatesUrl,
      profileUrl,
      profileLink: profileUrl
        ? ` (<a href="${profileUrl}" style="color:#6d28d9;text-decoration:underline;">view profile</a>)`
        : "",
      ctaLabel,
      municipalityName,
      stateName,
      locationFragment,
      locationSummary,
      locationDetail: locationDetail ?? "",
      positionDescriptor,
      positionName,
      originalHtml: "",
      senderName,
      senderTitle,
      senderLinkedInUrl,
      senderLinkedInLabel,
    };

    if (key === "followup" || key === "followup2") {
      const baseKey =
        opts?.baseForFollowup && opts.baseForFollowup !== key
          ? opts.baseForFollowup
          : "initial";
      const baseTemplate = await renderEmailTemplate(
        baseKey,
        data,
        opts,
        ctx
      );
      replacements.originalHtml = baseTemplate.html;
    }

    if (key === "verifiedUpdate" && !replacements.templatesUrl) {
      replacements.templatesUrl = claimUrl;
    }

    const subject = normalizeSubject(
      interpolate(template.subjectTemplate, replacements)
    );
    const html = interpolate(template.htmlTemplate, replacements);

    return { subject, html };
  } finally {
    ctx.visited.delete(key);
  }
}

export type { TemplateKey, DefaultTemplateKey } from "./constants";
export { EMAIL_TEMPLATE_VARIABLES, DEFAULT_TEMPLATE_KEYS } from "./constants";

export async function ensureDefaultEmailDocuments(): Promise<void> {
  const context = createEmailTemplateRenderContext();
  for (const key of DEFAULT_TEMPLATE_KEYS) {
    await fetchEmailDocument(key, context);
  }
}
