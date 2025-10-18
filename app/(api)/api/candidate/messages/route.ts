import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import prisma from "@/prisma/prisma";
import { sendWithResend } from "@/lib/email/resend";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const MAX_LIMIT = 50;

function parseLimit(limitParam: string | null): number {
  const parsed = Number.parseInt(limitParam || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 20;
  }
  return Math.min(parsed, MAX_LIMIT);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate profile not found" },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursorParam = url.searchParams.get("cursor");
  let cursorId: number | undefined;
  if (cursorParam !== null) {
    const parsed = Number.parseInt(cursorParam, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: "Invalid cursor parameter" },
        { status: 400 },
      );
    }
    cursorId = parsed;
  }

  const messages = await prisma.candidateMessage.findMany({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(typeof cursorId === "number"
      ? {
          cursor: { id: cursorId },
          skip: 1,
        }
      : {}),
  });

  const hasMore = messages.length > limit;
  const trimmed = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id ?? null : null;

  return NextResponse.json({
    messages: trimmed,
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    candidateId,
    subject,
    message,
    senderName,
    senderEmail,
  } = body ?? {};

  const candidateIdNumber =
    typeof candidateId === "number"
      ? candidateId
      : Number.parseInt(String(candidateId ?? ""), 10);

  if (
    !candidateIdNumber ||
    Number.isNaN(candidateIdNumber) ||
    typeof subject !== "string" ||
    typeof message !== "string" ||
    subject.trim().length === 0 ||
    message.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateIdNumber },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
    },
  });

  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 },
    );
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (entry) => entry.id === clerkUser.primaryEmailAddressId,
  );
  const fallbackEmail = primaryEmail?.emailAddress;
  const resolvedEmail =
    typeof senderEmail === "string" && senderEmail.trim().length > 0
      ? senderEmail.trim()
      : fallbackEmail;

  if (!resolvedEmail) {
    return NextResponse.json(
      { error: "Email address required" },
      { status: 400 },
    );
  }

  const displayName =
    typeof senderName === "string" && senderName.trim().length > 0
      ? senderName.trim()
      : [clerkUser.firstName, clerkUser.lastName]
          .filter((value) => Boolean(value && value.trim().length > 0))
          .join(" ")
          .trim() || clerkUser.username || "Elevra user";

  const thirtyMinutesAgo = new Date(Date.now() - THIRTY_MINUTES_MS);
  const recentCount = await prisma.candidateMessage.count({
    where: {
      candidateId: candidateIdNumber,
      senderClerkUserId: userId,
      createdAt: { gte: thirtyMinutesAgo },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        error:
          "You have reached the limit for contacting this candidate. Please try again later.",
      },
      { status: 429 },
    );
  }

  const created = await prisma.candidateMessage.create({
    data: {
      candidateId: candidateIdNumber,
      senderClerkUserId: userId,
      senderName: displayName,
      senderEmail: resolvedEmail,
      subject: subject.trim(),
      body: message.trim(),
    },
  });

  const sentAt = new Date();
  const formattedTimestamp = sentAt.toLocaleString("en-US", {
    timeZone: "UTC",
    hour12: true,
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const safeSubject = escapeHtml(created.subject);
  const safeBody = escapeHtml(created.body).replace(/\n/g, "<br />");
  const safeSender = escapeHtml(created.senderName);
  const safeCandidateName = escapeHtml(candidate.name);
  const safeSenderEmail = escapeHtml(created.senderEmail);

  const voterHtml = `
    <p>Hi ${safeSender},</p>
    <p>Thanks for reaching out to ${safeCandidateName} on Elevra. Here are the details of your message sent on ${formattedTimestamp} (UTC):</p>
    <p><strong>Subject:</strong> ${safeSubject}</p>
    <p><strong>Message:</strong></p>
    <p>${safeBody}</p>
    <p>If you didn't mean to send this message, you can reply to this email and our team will help out.</p>
    <p>— Elevra Team</p>
  `;

  const candidateHtml = `
    <p>You received a new message from ${safeSender} (${safeSenderEmail}) via Elevra on ${formattedTimestamp} (UTC).</p>
    <p><strong>Subject:</strong> ${safeSubject}</p>
    <p><strong>Message:</strong></p>
    <p>${safeBody}</p>
    <p>Reply directly to the sender using the email above.</p>
  `;

  await Promise.allSettled([
    sendWithResend({
      to: resolvedEmail,
      subject: `We sent your message to ${candidate.name}`,
      html: voterHtml,
    }),
    candidate.email
      ? sendWithResend({
          to: candidate.email,
          subject: `New message from ${displayName}`,
          html: candidateHtml,
        })
      : (async () => {
          // Candidate lacks a verified email; per product guidance we skip sending for now.
          console.info(
            "[candidate-messages] Candidate email missing, skipped send",
            { candidateId: candidate.id, slug: candidate.slug },
          );
        })(),
  ]);

  return NextResponse.json({ success: true, id: created.id });
}
