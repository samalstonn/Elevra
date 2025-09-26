/**
 * Handles POST requests to backfill content blocks for candidate-election links.
 * Only accessible by admin or subAdmin users. Supports dry run mode and filtering by candidate or election.
 * Returns a summary of processed, seeded, and skipped links.
 * 
 * All verified candidates (dry run, print slugs + election):
fetch('/api/admin/backfill-contentblocks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dryRun: true, onlyVerified: true })
})
.then(r => r.json())
.then(d => {
  console.log(`Verified candidates with zero blocks: ${d.seeded.length}`);
  console.table(d.seeded.map(s => ({
    slug: s.candidateSlug,
    election: `${s.election.position} — ${s.election.city}, ${s.election.state} (${s.election.date})`
  })));
  return d;
});

Specific candidate by slug (dry run, print slug + election):
fetch('/api/admin/backfill-contentblocks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ slug: 'existing-candidate-slug', dryRun: true, onlyVerified: true })
})
.then(r => r.json())
.then(d => {
  console.table(d.seeded.map(s => ({
    slug: s.candidateSlug,
    election: `${s.election.position} — ${s.election.city}, ${s.election.state} (${s.election.date})`
  })));
  return d;
});
 *
 */
import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { elevraStarterTemplate } from "@/app/(templates)/basicwebpage";

type BackfillBody = {
  dryRun?: boolean;
  candidateId?: number;
  slug?: string;
  electionId?: number;
  onlyVerified?: boolean;
};

type BackfilledCandidateList = Array<{
  candidateId: number;
  candidateSlug: string | null;
  candidateName: string | null;
  candidateVerified: boolean;
  electionId: number;
  election: { position: string; city: string; state: string; date: string };
  count?: number;
  reason?: string;
}>;

async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || "";
  const matches: string[] = raw.match(/user_[A-Za-z0-9]+/g) || [];
  if (matches.includes(userId)) return true;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return Boolean(user.privateMetadata?.isAdmin);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!(await isAdmin(userId))) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: BackfillBody = {};
    try {
      body = (await req.json()) as BackfillBody;
    } catch {
      // allow empty body
    }
    const dryRun = Boolean(body?.dryRun);

    let candidateId: number | undefined = body?.candidateId;
    if (!candidateId && body?.slug) {
      const c = await prisma.candidate.findUnique({
        where: { slug: body.slug },
        select: { id: true },
      });
      candidateId = c?.id;
      if (!candidateId) {
        return new Response(`Unknown candidate slug: ${body.slug}`, {
          status: 400,
        });
      }
    }

    // Build filter for election links
    const where: { candidateId?: number; electionId?: number } = {};
    if (candidateId) where.candidateId = candidateId;
    if (body?.electionId) where.electionId = body.electionId;

    const links = await prisma.electionLink.findMany({
      where,
      select: {
        candidateId: true,
        electionId: true,
        candidate: {
          select: { id: true, slug: true, name: true, verified: true },
        },
        election: {
          select: {
            id: true,
            position: true,
            city: true,
            state: true,
            date: true,
          },
        },
      },
    });

    // Optional: restrict to verified candidates only
    const onlyVerified = Boolean(body?.onlyVerified);
    const filteredLinks = onlyVerified
      ? links.filter((l) => l.candidate?.verified)
      : links;

    let processed = 0;
    let seededLinks = 0;
    let insertedBlocks = 0;
    const seeded: BackfilledCandidateList = [];
    const skipped: BackfilledCandidateList = [];

    for (const link of filteredLinks) {
      processed++;
      const count = await prisma.contentBlock.count({
        where: { candidateId: link.candidateId, electionId: link.electionId },
      });
      const eInfo = {
        position: link.election?.position || "",
        city: link.election?.city || "",
        state: link.election?.state || "",
        date: link.election?.date
          ? new Date(link.election.date).toISOString().slice(0, 10)
          : "",
      };
      const cSlug = link.candidate?.slug || null;
      const cName = link.candidate?.name || null;
      const cVerified = Boolean(link.candidate?.verified);

      if (count > 0) {
        skipped.push({
          candidateId: link.candidateId,
          candidateSlug: cSlug,
          candidateName: cName,
          candidateVerified: cVerified,
          electionId: link.electionId,
          election: eInfo,
          reason: `has ${count} block(s)`,
        });
        continue;
      }
      if (!dryRun) {
        const data = elevraStarterTemplate.map((block) => ({
          ...block,
          candidateId: link.candidateId,
          electionId: link.electionId,
        }));
        const res = await prisma.contentBlock.createMany({ data });
        insertedBlocks += res.count ?? data.length;
      }
      seededLinks++;
      seeded.push({
        candidateId: link.candidateId,
        candidateSlug: cSlug,
        candidateName: cName,
        candidateVerified: cVerified,
        electionId: link.electionId,
        election: eInfo,
        count: elevraStarterTemplate.length,
      });
    }

    return Response.json({
      ok: true,
      dryRun,
      filters: {
        candidateId: candidateId ?? null,
        electionId: body?.electionId ?? null,
      },
      processedLinks: processed,
      seededLinks,
      insertedBlocks,
      seeded,
      skipped,
      message: dryRun
        ? "Dry run: no blocks inserted"
        : "Backfill complete for links that had zero blocks",
    });
  } catch (err: unknown) {
    console.error("/api/admin/backfill-contentblocks error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
