import { NextRequest, NextResponse } from "next/server";
import {
  createEmailTemplateRenderContext,
  renderEmailTemplate,
  TemplateKey,
} from "@/lib/email/templates/render";
import { deriveSenderFields, SenderFields } from "@/lib/email/templates/sender";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: NextRequest) {
  try {
    const authState = getAuth(req);
    let derivedSender: SenderFields = {};
    if (authState?.userId) {
      try {
        const user = await clerkClient.users.getUser(authState.userId);
        derivedSender = deriveSenderFields(user);
      } catch (error) {
        console.error("Failed to derive sender fields for preview", error);
      }
    }

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
    const templateRaw =
      typeof body.template === "string"
        ? body.template.trim()
        : typeof body.templateType === "string"
        ? body.templateType.trim()
        : "";
    const key: TemplateKey = templateRaw || "initial";

    const data = isRecord(body.data) ? body.data : {};

    const baseTemplateRaw =
      typeof body.baseForFollowup === "string"
        ? body.baseForFollowup.trim()
        : typeof body.baseTemplate === "string"
        ? body.baseTemplate.trim()
        : undefined;

    const baseForFollowup = baseTemplateRaw;
    const requestSenderName =
      typeof data.senderName === "string" ? data.senderName.trim() : undefined;
    const requestSenderTitle =
      typeof data.senderTitle === "string" ? data.senderTitle.trim() : undefined;
    const requestSenderLinkedInUrl =
      typeof data.senderLinkedInUrl === "string"
        ? data.senderLinkedInUrl.trim()
        : undefined;
    const requestSenderLinkedInLabel =
      typeof data.senderLinkedInLabel === "string"
        ? data.senderLinkedInLabel.trim()
        : undefined;

    const senderName = requestSenderName || derivedSender.senderName;
    const senderTitle = requestSenderTitle || derivedSender.senderTitle;
    let senderLinkedInUrl =
      requestSenderLinkedInUrl || derivedSender.senderLinkedInUrl;
    if (senderLinkedInUrl && !/^https?:\/\//i.test(senderLinkedInUrl)) {
      senderLinkedInUrl = `https://${senderLinkedInUrl}`;
    }
    const senderLinkedInLabel =
      requestSenderLinkedInLabel || derivedSender.senderLinkedInLabel;

    const context = createEmailTemplateRenderContext();
    const { subject, html } = await renderEmailTemplate(
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
        municipality:
          typeof data.municipality === "string" ? data.municipality : undefined,
        position: typeof data.position === "string" ? data.position : undefined,
        senderName,
        senderTitle,
        senderLinkedInUrl,
        senderLinkedInLabel,
      },
      { baseForFollowup },
      context
    );
    return NextResponse.json({ subject, html });
  } catch (e) {
    console.error("preview render failed", e);
    return NextResponse.json({ error: "Failed to render preview" }, { status: 400 });
  }
}
