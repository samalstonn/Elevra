/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { generateUniqueSlug, isElectionActive } from "@/lib/functions";

type StructuredCandidate = {
  clerkUserId?: string | null;
  slug?: string | null;
  name: string;
  currentRole?: string | null;
  party?: string | null;
  image_url?: string | null;
  linkedin_url?: string | null;
  campaign_website_url?: string | null;
  bio?: string | null;
  key_policies?: string[] | null;
  home_city?: string | null;
  hometown_state?: string | null;
  additional_notes?: string | null;
  sources?: string[] | null;
  email?: string | null;
};

type StructuredElection = {
  election: {
    title: string;
    type: "LOCAL" | "UNIVERSITY" | "STATE" | "NATIONAL" | string;
    date: string; // MM/DD/YYYY
    city: string;
    state: string;
    number_of_seats?: string | null;
    description: string;
  };
  candidates: StructuredCandidate[];
};

function cleanOptional(value?: string | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s.toUpperCase() === "N/A") return null;
  return s;
}

function parseDateMMDDYYYY(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s?.trim?.() || "");
  if (!m) return null;
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  const yyyy = m[3];
  const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function parseSeats(s?: string | null): number | null {
  if (!s) return null;
  const m = /\d+/.exec(s);
  return m ? parseInt(m[0], 10) : null;
}

function coerceType(
  t: string | undefined
): "LOCAL" | "STATE" | "UNIVERSITY" | "NATIONAL" {
  const v = (t || "").toUpperCase();
  if (v === "STATE" || v === "UNIVERSITY" || v === "NATIONAL") return v as any;
  return "LOCAL";
}

export async function POST(req: NextRequest) {
  try {
    // Authorization: allow E2E header secret or fallback to admin check
    const headerSecret =
      req.headers.get("x-e2e-seed-secret") || req.headers.get("x-seed-secret");
    const normalizedHeaderSecret = headerSecret?.trim();
    const envSecret = (process.env.E2E_SEED_SECRET || "").trim();
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;
    const envToken = (process.env.SEED_API_TOKEN || "").trim();
    const bypassAuth = Boolean(
      (normalizedHeaderSecret &&
        envSecret &&
        normalizedHeaderSecret === envSecret) ||
        (bearerToken && envToken && bearerToken === envToken)
    );

    let userId: string | null = null;

    async function isAdmin(u: string | null): Promise<boolean> {
      if (!u) return false;
      // Allow env-based admin list (e.g., ADMIN_USER_IDS="user_abc user_def")
      const raw = process.env.ADMIN_USER_IDS || "";
      const matches: string[] = raw.match(/user_[A-Za-z0-9]+/g) || [];
      if (matches.includes(u)) return true;
      try {
        const user = await clerkClient.users.getUser(u);
        return Boolean(
          user.privateMetadata?.isAdmin || user.privateMetadata?.isSubAdmin
        );
      } catch {
        return false;
      }
    }
    if (!bypassAuth) {
      try {
        const authResult = await auth();
        userId = authResult.userId;
      } catch (err) {
        console.error("/api/admin/seed-structured auth error", err);
        return new Response("Unauthorized", { status: 401 });
      }

      if (!(await isAdmin(userId))) {
        return new Response("Unauthorized", { status: 401 });
      }
    }
    const body = (await req.json()) as {
      structured?: string;
      data?: any;
      hidden?: boolean;
      forceHidden?: boolean;
      uploadedBy: string;
    };
    const payload = body?.data ?? body?.structured;
    let input: any;
    if (typeof payload === "string") {
      try {
        input = JSON.parse(payload);
      } catch (parseError) {
        console.error(
          "/api/admin/seed-structured invalid JSON",
          parseError
        );
        return new Response("Invalid JSON payload", { status: 400 });
      }
    } else {
      input = payload;
    }
    if (!input || !Array.isArray(input.elections)) {
      return new Response("Invalid input: missing elections array", {
        status: 400,
      });
    }

    const hiddenInProd = process.env.NODE_ENV === "production";
    const forceHidden = Boolean(body?.hidden ?? body?.forceHidden);
    const hiddenFlag = forceHidden || hiddenInProd;
    const uploadedBy = String(body?.uploadedBy || "<unknown>");

    const results: Array<{
      electionId: number;
      position: string;
      city: string;
      state: string;
      hidden: boolean;
      candidateSlugs: string[];
      candidateEmails?: (string | null)[];
    }> = [];

    for (const item of input.elections as StructuredElection[]) {
      const e = item.election;
      const date = parseDateMMDDYYYY(e.date);
      if (!date) {
        return new Response(
          `Invalid date for election '${e.title}': '${e.date}'`,
          { status: 400 }
        );
      }
      const positions = parseSeats(e.number_of_seats ?? undefined) ?? 1;
      const position = e.title || "Election";
      const type = coerceType(e.type as string);
      const active = isElectionActive(date);

      const election = await prisma.election.create({
        data: {
          position,
          date,
          active,
          city: e.city,
          description: e.description,
          positions,
          state: e.state,
          type,
          hidden: hiddenFlag,
          uploadedBy: uploadedBy,
        },
      });

      const candidateSlugs: string[] = [];
      const candidateEmails: (string | null)[] = [];
      for (const c of item.candidates || []) {
        const name = c.name?.trim?.() || "Unnamed";
        const requestedSlug = c.slug?.trim?.();
        const slug = requestedSlug?.length
          ? requestedSlug
          : await generateUniqueSlug(name, undefined, "candidate");
        const candidate = await prisma.candidate.upsert({
          where: { slug },
          update: {
            currentRole: c.currentRole ?? null,
            website: cleanOptional(c.campaign_website_url),
            linkedin: cleanOptional(c.linkedin_url),
            bio: c.bio ?? "",
            currentCity: c.home_city ?? null,
            currentState: c.hometown_state ?? null,
            status: "APPROVED",
            verified: false,
            email: cleanOptional(c.email ?? null),
            hidden: hiddenFlag,
            uploadedBy: uploadedBy,
            clerkUserId: c.clerkUserId || null,
          },
          create: {
            name,
            slug,
            currentRole: c.currentRole ?? null,
            website: cleanOptional(c.campaign_website_url),
            linkedin: cleanOptional(c.linkedin_url),
            bio: c.bio ?? "",
            currentCity: c.home_city ?? null,
            currentState: c.hometown_state ?? null,
            status: "APPROVED",
            verified: false,
            email: cleanOptional(c.email ?? null),
            hidden: hiddenFlag,
            uploadedBy: uploadedBy,
            clerkUserId: c.clerkUserId || null,
          },
        });

        candidateSlugs.push(candidate.slug);
        candidateEmails.push(candidate.email ?? null);

        await prisma.electionLink.upsert({
          where: {
            candidateId_electionId: {
              candidateId: candidate.id,
              electionId: election.id,
            },
          },
          update: {},
          create: {
            candidateId: candidate.id,
            electionId: election.id,
            party: c.party ?? "",
            sources: c.sources ?? [],
            additionalNotes: c.additional_notes ?? null,
            policies: c.key_policies ?? [],
          },
        });
      }

      results.push({
        electionId: election.id,
        position,
        city: election.city,
        state: election.state,
        hidden: election.hidden,
        candidateSlugs,
        candidateEmails,
      });
    }

    return Response.json({
      success: true,
      results,
      message: hiddenFlag
        ? "Election(s) and candidates created as hidden. Uploaded by: " +
          uploadedBy
        : "Election(s) created (visible). Uploaded by: " + uploadedBy,
    });
  } catch (err: any) {
    console.error("/api/admin/seed-structured error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
