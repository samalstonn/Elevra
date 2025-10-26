import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Candidate upgrade checkout cannot be initialized."
  );
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
});

type CandidatePlanTier = "premium";

type PlanDefinition = {
  priceId?: string;
  mode: Stripe.Checkout.SessionCreateParams.Mode;
  description: string;
};

const planConfigurations: Record<CandidatePlanTier, PlanDefinition> = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_CANDIDATE_PRICE_ID,
    mode: "payment",
    description: "Premium Candidate Upgrade",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body.plan !== "string") {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    const requestedPlan = body.plan.toLowerCase() as CandidatePlanTier;

    if (!(requestedPlan in planConfigurations)) {
      return NextResponse.json(
        { error: "Unsupported upgrade plan" },
        { status: 400 }
      );
    }

    const planConfig = planConfigurations[requestedPlan];

    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Plan is not configured. Contact support." },
        { status: 500 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, slug: true, name: true },
    });

    if (!candidate) {

      return NextResponse.json(
        { error: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    const currentTier = (
      clerkUser.publicMetadata?.candidateSubscriptionTier as string | undefined
    )
      ?.toLowerCase()
      ?.trim();

    if (currentTier === requestedPlan) {
      return NextResponse.json(
        { error: "You are already on this plan." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: planConfig.mode,
      customer_email: clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress,
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/candidates/candidate-dashboard/upgrade?status=success`,
      cancel_url: `${baseUrl}/candidates/candidate-dashboard/upgrade?status=cancelled`,
      metadata: {
        purpose: "candidate_upgrade",
        tier: requestedPlan,
        candidateId: String(candidate.id),
        candidateSlug: candidate.slug,
        candidateName: candidate.name,
        userClerkId: userId,
      },
    });

    // Send notification email to team
    const candidateEmail =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || "No email available";

    try {
      const emailHtml = renderAdminNotification({
        title: "🚀 Premium Upgrade Initiated",
        intro: `A candidate has clicked the upgrade to premium button and is proceeding to checkout.`,
        rows: [
          { label: "Candidate Name", value: candidate.name },
          { label: "Candidate Email", value: candidateEmail },
          { label: "Candidate Slug", value: candidate.slug },
          { label: "Plan", value: requestedPlan.toUpperCase() },
          { label: "Stripe Session ID", value: session.id },
        ],
        ctaLabel: "View Candidate Profile",
        ctaUrl: `${baseUrl}/candidate/${candidate.slug}`,
      });

      await sendWithResend({
        to: "team@elevracommunity.com",
        subject: `Premium Upgrade Started: ${candidate.name}`,
        html: emailHtml,
      });
    } catch (emailError) {
      // Log error but don't block the upgrade process
      console.error("Failed to send upgrade notification email:", emailError);
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error: unknown) {
    console.error("Failed to start candidate upgrade checkout", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
