import { NextRequest, NextResponse } from "next/server";
import { renderCandidateVerificationEmail } from "@/lib/email/templates/candidateVerified";

export const runtime = "nodejs";

type PreviewPayload = {
  firstName?: string;
  dashboardUrl?: string;
  profileUrl?: string;
  supportEmail?: string;
};

export async function POST(req: NextRequest) {
  let body: PreviewPayload;
  try {
    body = (await req.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dashboardUrl =
    typeof body.dashboardUrl === "string" && body.dashboardUrl.trim()
      ? body.dashboardUrl.trim()
      : `${process.env.NEXT_PUBLIC_APP_URL}/candidates/candidate-dashboard`;

  const profileUrl =
    typeof body.profileUrl === "string" && body.profileUrl.trim()
      ? body.profileUrl.trim()
      : undefined;

  const firstName =
    typeof body.firstName === "string" && body.firstName.trim()
      ? body.firstName.trim()
      : undefined;

  const supportEmail =
    typeof body.supportEmail === "string" && body.supportEmail.trim()
      ? body.supportEmail.trim()
      : undefined;

  const { subject, html } = renderCandidateVerificationEmail({
    firstName,
    dashboardUrl,
    profileUrl,
    supportEmail,
  });

  return NextResponse.json({ subject, html });
}
