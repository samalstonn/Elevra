import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

import { Prisma } from "@prisma/client";

import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATE_KEYS } from "@/lib/email/templates/constants";

export const runtime = "nodejs";

const DEFAULT_TEMPLATE_KEY_SET = new Set<string>(DEFAULT_TEMPLATE_KEYS);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: rawKey } = await params;
  const keyParam = rawKey?.trim();

  if (!keyParam) {
    return NextResponse.json(
      { error: "Missing email template key." },
      { status: 400 }
    );
  }

  const auth = getAuth(req);
  const userId = auth?.userId;
  const flags = await requireAdminOrSubAdmin(userId);

  if (!flags || !flags.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    typeof (payload as { subjectTemplate?: unknown }).subjectTemplate !==
      "string" ||
    typeof (payload as { htmlTemplate?: unknown }).htmlTemplate !== "string"
  ) {
    return NextResponse.json(
      { error: "subjectTemplate and htmlTemplate fields are required" },
      { status: 400 }
    );
  }

  const subjectTemplate = (
    payload as { subjectTemplate: string }
  ).subjectTemplate.trim();
  const htmlTemplate = (payload as { htmlTemplate: string }).htmlTemplate;

  if (!subjectTemplate) {
    return NextResponse.json(
      { error: "Subject template cannot be empty." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.emailDocument.update({
      where: { key: keyParam },
      data: {
        subjectTemplate,
        htmlTemplate,
      },
    });

    return NextResponse.json({
      id: updated.id,
      key: updated.key,
      subjectTemplate: updated.subjectTemplate,
      htmlTemplate: updated.htmlTemplate,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update email template", { keyParam, error });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Email template not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update email template." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: rawKey } = await params;
  const keyParam = rawKey?.trim();

  if (!keyParam) {
    return NextResponse.json(
      { error: "Missing email template key." },
      { status: 400 }
    );
  }

  const auth = getAuth(req);
  const userId = auth?.userId;
  const flags = await requireAdminOrSubAdmin(userId);

  if (!flags || !flags.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (DEFAULT_TEMPLATE_KEY_SET.has(keyParam)) {
    return NextResponse.json(
      { error: "Default email templates cannot be deleted." },
      { status: 400 }
    );
  }

  try {
    await prisma.emailDocument.delete({
      where: { key: keyParam },
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete email template", { keyParam, error });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Email template not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete email template." },
      { status: 500 }
    );
  }
}
