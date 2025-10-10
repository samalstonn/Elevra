import fs from "node:fs";
import path from "node:path";

import { formatGreetingName, formatLocationValue } from "./formatGreetingName";

export type TemplateKey =
  | "initial"
  | "followup"
  | "verifiedUpdate"
  | "followup2";

const SUBJECTS: Record<TemplateKey, string> = {
  initial: "Welcome to Elevra",
  followup: "RE: Claim your Elevra profile",
  followup2: "RE: Don't miss out on Elevra",
  verifiedUpdate: "Update: Templates are back — create your candidate webpage",
};

function readTemplateFile(key: TemplateKey): string {
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

function interpolate(html: string, vars: Record<string, string>): string {
  return html.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_: string, k: string) => {
      const v = vars[k];
      return v != null ? String(v) : "";
    }
  );
}

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

const DEFAULT_SENDER_NAME = "Adam Rose";
const DEFAULT_SENDER_TITLE = "Elevra | Cornell ’25";
const DEFAULT_SENDER_LINKEDIN_URL =
  "https://www.linkedin.com/company/elevracommunity/posts/?feedView=all";
const DEFAULT_SENDER_LINKEDIN_LABEL = "LinkedIn";

export function renderEmailTemplate(
  key: TemplateKey,
  data: RenderInput,
  opts?: { baseForFollowup?: TemplateKey }
): { subject: string; html: string } {
  const greetingName = formatGreetingName(data.candidateFirstName);
  const stateName = formatLocationValue(data.state);
  const municipalityName = formatLocationValue(data.municipality);
  const positionName = formatLocationValue(data.position);

  const locationDetail =
    municipalityName && stateName
      ? `${municipalityName}, ${stateName}`
      : municipalityName
      ? municipalityName
      : stateName;

  const locationFragment = municipalityName
    ? `in ${municipalityName}`
    : "near you";
  const locationSummary = stateName ? ` in ${stateName}` : "";
  const positionDescriptor = positionName ? `${positionName}` : "";
  const senderNameValue = (data.senderName || "").trim();
  const senderTitleValue = (data.senderTitle || "").trim();
  const senderLinkedInUrlValue = (data.senderLinkedInUrl || "").trim();
  const senderLinkedInLabelValue = (data.senderLinkedInLabel || "").trim();

  if (key === "followup") {
    const base = opts?.baseForFollowup || "initial";
    const original = renderEmailTemplate(base, {
      candidateFirstName: data.candidateFirstName,
      state: data.state,
      claimUrl: data.claimUrl,
      templatesUrl: data.templatesUrl,
      profileUrl: data.profileUrl,
      municipality: data.municipality,
      position: data.position,
      senderName: senderNameValue,
      senderTitle: senderTitleValue,
      senderLinkedInUrl: senderLinkedInUrlValue,
      senderLinkedInLabel: senderLinkedInLabelValue,
    }).html;
    const src = readTemplateFile("followup");
    const html = interpolate(src, {
      greetingName,
      claimUrl: data.claimUrl || "",
      locationFragment,
      locationSummary,
      locationDetail: locationDetail || "",
      positionDescriptor,
      positionName,
      originalHtml: original,
    });
    return { subject: SUBJECTS.followup, html };
  }

  if (key === "followup2") {
    const base = opts?.baseForFollowup || "initial";
    const original = renderEmailTemplate(base, {
      candidateFirstName: data.candidateFirstName,
      state: data.state,
      claimUrl: data.claimUrl,
      templatesUrl: data.templatesUrl,
      profileUrl: data.profileUrl,
      municipality: data.municipality,
      position: data.position,
      senderName: senderNameValue,
      senderTitle: senderTitleValue,
      senderLinkedInUrl: senderLinkedInUrlValue,
      senderLinkedInLabel: senderLinkedInLabelValue,
    }).html;
    const src = readTemplateFile("followup2");
    const html = interpolate(src, {
      greetingName,
      claimUrl: data.claimUrl || "",
      locationFragment,
      locationSummary,
      locationDetail: locationDetail || "",
      positionDescriptor,
      positionName,
      originalHtml: original,
    });
    return { subject: SUBJECTS.followup2, html };
  }

  if (key === "verifiedUpdate") {
    const src = readTemplateFile("verifiedUpdate");
    const profileLink = data.profileUrl
      ? ` (<a href=\"${data.profileUrl}\" style=\"color:#6d28d9;text-decoration:underline;\">view profile</a>)`
      : "";
    const html = interpolate(src, {
      greetingName,
      templatesUrl: data.templatesUrl || data.claimUrl || "",
      profileLink,
      ctaLabel: data.ctaLabel || "Create My Webpage",
      locationFragment,
      locationSummary,
      locationDetail: locationDetail || "",
      positionDescriptor,
      positionName,
    });
    return { subject: SUBJECTS.verifiedUpdate, html };
  }

  if (key === "initial") {
    const src = readTemplateFile("initial");
    const senderName = (data.senderName || "").trim() || DEFAULT_SENDER_NAME;
    const senderTitle = (data.senderTitle || "").trim() || DEFAULT_SENDER_TITLE;
    const senderLinkedInUrl =
      (data.senderLinkedInUrl || "").trim() || DEFAULT_SENDER_LINKEDIN_URL;
    const senderLinkedInLabel =
      (data.senderLinkedInLabel || "").trim() || DEFAULT_SENDER_LINKEDIN_LABEL;
    const html = interpolate(src, {
      greetingName,
      claimUrl: data.claimUrl || "",
      locationFragment,
      locationSummary,
      locationDetail: locationDetail || "",
      positionDescriptor,
      positionName,
      senderName,
      senderTitle,
      senderLinkedInUrl,
      senderLinkedInLabel,
    });
    return { subject: SUBJECTS.initial, html };
  }

  throw new Error(`Unknown template key: ${key}`);
}
