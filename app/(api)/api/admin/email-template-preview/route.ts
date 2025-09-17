import { NextRequest, NextResponse } from "next/server";
import { renderEmailTemplate, TemplateKey } from "@/lib/email/templates/render";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = String(body.template || body.templateType || "initial") as TemplateKey;
    const data = body.data || {};
    const baseForFollowup = (body.baseForFollowup || body.baseTemplate) as TemplateKey | undefined;
    const { subject, html } = renderEmailTemplate(
      key,
      {
        candidateFirstName: data.candidateFirstName,
        state: data.state,
        claimUrl: data.claimUrl,
        templatesUrl: data.templatesUrl,
        profileUrl: data.profileUrl,
        ctaLabel: data.ctaLabel,
      },
      { baseForFollowup }
    );
    return NextResponse.json({ subject, html });
  } catch (e) {
    console.error("preview render failed", e);
    return NextResponse.json({ error: "Failed to render preview" }, { status: 400 });
  }
}

