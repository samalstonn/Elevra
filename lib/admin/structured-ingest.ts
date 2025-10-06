/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/prisma/prisma";
import { generateUniqueSlug, isElectionActive } from "@/lib/functions";

export type StructuredCandidate = {
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

export type StructuredElection = {
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

export type StructuredInput = {
  elections: StructuredElection[];
};

export type StructuredIngestResult = {
  electionId: number;
  position: string;
  city: string;
  state: string;
  hidden: boolean;
  candidateSlugs: string[];
  candidateEmails?: (string | null)[];
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

export async function ingestStructuredPayload({
  input,
  hiddenFlag,
  uploadedBy,
}: {
  input: StructuredInput;
  hiddenFlag: boolean;
  uploadedBy: string;
}): Promise<StructuredIngestResult[]> {
  const results: StructuredIngestResult[] = [];

  for (const item of input.elections) {
    const e = item.election;
    const date = parseDateMMDDYYYY(e.date);
    if (!date) {
      throw new Error(`Invalid date for election '${e.title}': '${e.date}'`);
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
        uploadedBy,
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
          uploadedBy,
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
          uploadedBy,
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

  return results;
}
