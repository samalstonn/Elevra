import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultEmailDocuments } from "@/lib/email/templates/render";

export const runtime = "nodejs";

function slugifyKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  const flags = await requireAdminOrSubAdmin(auth?.userId);
  if (!flags) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureDefaultEmailDocuments();

  const templates = await prisma.emailDocument.findMany({
    orderBy: [{ title: "asc" }, { key: "asc" }],
  });

  return NextResponse.json({
    templates: templates.map((template) => ({
      id: template.id,
      key: template.key,
      title: template.title,
      subjectTemplate: template.subjectTemplate,
      htmlTemplate: template.htmlTemplate,
      description: template.description ?? undefined,
      updatedAt: template.updatedAt.toISOString(),
      createdAt: template.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  const flags = await requireAdminOrSubAdmin(auth?.userId);
  if (!flags || !flags.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const {
    title: rawTitle,
    key: rawKey,
    subjectTemplate: rawSubject,
    htmlTemplate: rawHtml,
    description: rawDescription,
  } = payload as {
    title?: unknown;
    key?: unknown;
    subjectTemplate?: unknown;
    htmlTemplate?: unknown;
    description?: unknown;
  };

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const candidateKey =
    typeof rawKey === "string" && rawKey.trim().length > 0
      ? slugifyKey(rawKey.trim())
      : slugifyKey(title);
  if (!candidateKey) {
    return NextResponse.json(
      { error: "Unable to derive a valid key. Use letters, numbers, and dashes only." },
      { status: 400 }
    );
  }

  const subjectTemplate =
    typeof rawSubject === "string" ? rawSubject.trim() : `Message for ${title}`;
  const htmlTemplate =
    typeof rawHtml === "string"
      ? rawHtml
      : `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,Cantarell,'Helvetica Neue',Arial;">
  <p style="margin:0 0 16px;">Hi {{greetingName}},</p>
  <p style="margin:0 0 16px;">Your message here.</p>
  <p style="margin:0;">Best,<br />The Elevra Team</p>
</div>`;
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;

  const existing = await prisma.emailDocument.findUnique({
    where: { key: candidateKey },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A template with key "${candidateKey}" already exists.` },
      { status: 409 }
    );
  }

  const created = await prisma.emailDocument.create({
    data: {
      key: candidateKey,
      title,
      subjectTemplate,
      htmlTemplate,
      description,
    },
  });

  return NextResponse.json(
    {
      template: {
        id: created.id,
        key: created.key,
        title: created.title,
        subjectTemplate: created.subjectTemplate,
        htmlTemplate: created.htmlTemplate,
        description: created.description ?? undefined,
        updatedAt: created.updatedAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
