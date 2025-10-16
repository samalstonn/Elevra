"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureDefaultEmailDocuments,
  type TemplateKey,
} from "@/lib/email/templates/render";

import EmailTemplatesClient from "./EmailTemplatesClient";

export default async function EmailTemplatesPage() {
  const { userId } = await auth();
  const flags = await requireAdminOrSubAdmin(userId);

  if (!flags || !flags.isAdmin) {
    redirect("/admin");
  }

  await ensureDefaultEmailDocuments();

  const templates = await prisma.emailDocument.findMany({
    orderBy: [{ title: "asc" }, { key: "asc" }],
  });

  return (
    <EmailTemplatesClient
      initialTemplates={templates.map((template) => ({
        id: template.id,
        key: template.key as TemplateKey,
        title: template.title,
        subjectTemplate: template.subjectTemplate,
        htmlTemplate: template.htmlTemplate,
        description: template.description ?? undefined,
        updatedAt: template.updatedAt.toISOString(),
        createdAt: template.createdAt.toISOString(),
      }))}
    />
  );
}
