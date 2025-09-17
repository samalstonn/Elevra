import fs from "node:fs";
import path from "node:path";

export type TemplateKey = "initial" | "followup" | "verifiedUpdate";

const SUBJECTS: Record<TemplateKey, string> = {
  initial: "Your Candidate Profile is Live on Elevra",
  followup: "RE: Claim your Elevra profile",
  verifiedUpdate: "Update: Templates are back — create your candidate webpage",
};

function readTemplateFile(key: TemplateKey): string {
  const file =
    key === "initial"
      ? "initial.html"
      : key === "followup"
      ? "followup.html"
      : "verified-update.html";
  const filePath = path.join(process.cwd(), "lib/email/templates/html", file);
  return fs.readFileSync(filePath, "utf8");
}

function interpolate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_: string, k: string) => {
    const v = vars[k];
    return v != null ? String(v) : "";
  });
}

export type RenderInput = {
  candidateFirstName?: string;
  state?: string;
  claimUrl?: string;
  templatesUrl?: string;
  profileUrl?: string;
  ctaLabel?: string;
};

export function renderEmailTemplate(
  key: TemplateKey,
  data: RenderInput,
  opts?: { baseForFollowup?: TemplateKey }
): { subject: string; html: string } {
  const greetingName = (data.candidateFirstName || "").trim() || "there";
  const locationFragment = data.state ? `in ${data.state}` : "";

  if (key === "followup") {
    const base = opts?.baseForFollowup || "initial";
    const original = renderEmailTemplate(base, {
      candidateFirstName: data.candidateFirstName,
      state: data.state,
      claimUrl: data.claimUrl,
      templatesUrl: data.templatesUrl,
      profileUrl: data.profileUrl,
    }).html;
    const src = readTemplateFile("followup");
    const html = interpolate(src, {
      greetingName,
      claimUrl: data.claimUrl || "",
      locationFragment,
      originalHtml: original,
    });
    return { subject: SUBJECTS.followup, html };
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
    });
    return { subject: SUBJECTS.verifiedUpdate, html };
  }

  // initial
  const src = readTemplateFile("initial");
  const html = interpolate(src, {
    greetingName,
    claimUrl: data.claimUrl || "",
    locationFragment,
  });
  return { subject: SUBJECTS.initial, html };
}
