import { NextRequest, NextResponse } from "next/server";
import { renderEmailTemplate, TemplateKey } from "@/lib/email/templates/render";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTemplateKey(value: unknown): value is TemplateKey {
  return value === "initial" || value === "followup" || value === "verifiedUpdate";
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Missing request body" },
        { status: 400 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!isRecord(parsed)) {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      );
    }

    const body = parsed;
    const templateRaw = isTemplateKey(body.template)
      ? body.template
      : isTemplateKey(body.templateType)
      ? body.templateType
      : undefined;
    const key: TemplateKey = templateRaw ?? "initial";

    const data = isRecord(body.data) ? body.data : {};

    const baseTemplateRaw = isTemplateKey(body.baseForFollowup)
      ? body.baseForFollowup
      : isTemplateKey(body.baseTemplate)
      ? body.baseTemplate
      : undefined;

    const baseForFollowup = baseTemplateRaw;
    const { subject, html } = renderEmailTemplate(
      key,
      {
        candidateFirstName:
          typeof data.candidateFirstName === "string"
            ? data.candidateFirstName
            : undefined,
        state: typeof data.state === "string" ? data.state : undefined,
        claimUrl: typeof data.claimUrl === "string" ? data.claimUrl : undefined,
        templatesUrl:
          typeof data.templatesUrl === "string" ? data.templatesUrl : undefined,
        profileUrl:
          typeof data.profileUrl === "string" ? data.profileUrl : undefined,
        ctaLabel: typeof data.ctaLabel === "string" ? data.ctaLabel : undefined,
      },
      { baseForFollowup }
    );
    return NextResponse.json({ subject, html });
  } catch (e) {
    console.error("preview render failed", e);
    return NextResponse.json({ error: "Failed to render preview" }, { status: 400 });
  }
}
