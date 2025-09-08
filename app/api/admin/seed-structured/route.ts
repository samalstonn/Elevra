/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import prisma from "@/prisma/prisma";
import { generateUniqueSlug, isElectionActive } from "@/lib/functions";

type StructuredCandidate = {
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

function coerceType(t: string | undefined): "LOCAL" | "STATE" | "UNIVERSITY" | "NATIONAL" {
  const v = (t || "").toUpperCase();
  if (v === "STATE" || v === "UNIVERSITY" || v === "NATIONAL") return v as any;
  return "LOCAL";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { structured?: string; data?: any };
    const payload = body?.data ?? body?.structured;
    let input: any;
    if (typeof payload === "string") {
      input = JSON.parse(payload);
    } else {
      input = payload;
    }
    if (!input || !Array.isArray(input.elections)) {
      return new Response("Invalid input: missing elections array", { status: 400 });
    }

    const hiddenInProd = process.env.NODE_ENV === "production";

    const results: Array<{
      electionId: number;
      position: string;
      city: string;
      state: string;
      hidden: boolean;
      candidateSlugs: string[];
    }> = [];

    for (const item of input.elections as StructuredElection[]) {
      const e = item.election;
      const date = parseDateMMDDYYYY(e.date);
      if (!date) {
        return new Response(`Invalid date for election '${e.title}': '${e.date}'`, { status: 400 });
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
          hidden: hiddenInProd,
        },
      });

      const candidateSlugs: string[] = [];
      for (const c of item.candidates || []) {
        const name = c.name?.trim?.() || "Unnamed";
        const slug = await generateUniqueSlug(name, undefined, "candidate");
        const candidate = await prisma.candidate.upsert({
          where: { slug },
          update: {
            currentRole: c.currentRole ?? null,
            website: c.campaign_website_url && c.campaign_website_url !== "N/A" ? c.campaign_website_url : null,
            linkedin: c.linkedin_url && c.linkedin_url !== "N/A" ? c.linkedin_url : null,
            bio: c.bio ?? "",
            currentCity: c.home_city ?? null,
            currentState: c.hometown_state ?? null,
            status: "APPROVED",
            verified: false,
            email: c.email ?? null,
          },
          create: {
            name,
            slug,
            currentRole: c.currentRole ?? null,
            website: c.campaign_website_url && c.campaign_website_url !== "N/A" ? c.campaign_website_url : null,
            linkedin: c.linkedin_url && c.linkedin_url !== "N/A" ? c.linkedin_url : null,
            bio: c.bio ?? "",
            currentCity: c.home_city ?? null,
            currentState: c.hometown_state ?? null,
            status: "APPROVED",
            verified: false,
            email: c.email ?? null,
          },
        });

        candidateSlugs.push(candidate.slug);

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
      });
    }

    return Response.json({
      success: true,
      results,
      message: hiddenInProd
        ? "Election(s) created as hidden in production."
        : "Election(s) created (visible in non‑prod).",
    });
  } catch (err: any) {
    console.error("/api/admin/seed-structured error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
