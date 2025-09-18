import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

async function isAdminUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || "";
  const matches: string[] = raw.match(/user_[A-Za-z0-9]+/g) || [];
  if (matches.includes(userId)) return true;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return Boolean(user.privateMetadata?.isAdmin || user.privateMetadata?.isSubAdmin);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const headerSecret = req.headers.get("x-e2e-seed-secret") || req.headers.get("x-seed-secret");
    const envSecret = process.env.E2E_SEED_SECRET || "";
    const bypassAuth = Boolean(headerSecret && envSecret && headerSecret === envSecret);

    const { userId } = await auth();
    if (!bypassAuth && !(await isAdminUser(userId))) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      candidateSlug?: string;
      candidateId?: number;
      electionId?: number;
    };

    if (!body) return new Response("Bad Request", { status: 400 });

    // Candidate cascade delete
    if (body.candidateSlug || body.candidateId) {
      const or: Array<{ id?: number; slug?: string }> = [];
      if (typeof body.candidateId === "number") or.push({ id: body.candidateId });
      if (typeof body.candidateSlug === "string" && body.candidateSlug) or.push({ slug: body.candidateSlug });

      const candidate = await prisma.candidate.findFirst({
        where: {
          OR: or.length ? or : undefined,
        },
      });
      if (!candidate) {
        return new Response("Candidate not found", { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Remove validation requests referencing this candidate
        const vr = await tx.userValidationRequest.deleteMany({
          where: { candidateId: candidate.id },
        });

        // Delete election links for this candidate (ContentBlocks cascade via FK)
        const el = await tx.electionLink.deleteMany({
          where: { candidateId: candidate.id },
        });

        // Finally delete the candidate (other related rows have onDelete: Cascade)
        const c = await tx.candidate.delete({ where: { id: candidate.id } });

        return { deletedValidationRequests: vr.count, deletedElectionLinks: el.count, deletedCandidateId: c.id };
      });

      return Response.json({ success: true, type: "candidate", result });
    }

    // Election cascade delete
    if (body.electionId) {
      const election = await prisma.election.findUnique({ where: { id: body.electionId } });
      if (!election) return new Response("Election not found", { status: 404 });

      const result = await prisma.$transaction(async (tx) => {
        // Delete links for this election (ContentBlocks cascade via FK)
        const el = await tx.electionLink.deleteMany({ where: { electionId: election.id } });
        // Delete election itself
        const e = await tx.election.delete({ where: { id: election.id } });
        return { deletedElectionLinks: el.count, deletedElectionId: e.id };
      });

      return Response.json({ success: true, type: "election", result });
    }

    return new Response("Missing candidateSlug/candidateId or electionId", { status: 400 });
  } catch (err) {
    console.error("/api/admin/cascade-delete error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const headerSecret = req.headers.get("x-e2e-seed-secret") || req.headers.get("x-seed-secret");
    const envSecret = process.env.E2E_SEED_SECRET || "";
    const bypassAuth = Boolean(headerSecret && envSecret && headerSecret === envSecret);

    const { userId } = await auth();
    if (!bypassAuth && !(await isAdminUser(userId))) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const slugParams = url.searchParams.getAll("slug");
    const slugsCsv = url.searchParams.get("slugs");
    let slugs: string[] = [];
    if (slugParams.length) slugs.push(...slugParams);
    if (slugsCsv) slugs.push(...slugsCsv.split(","));
    slugs = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
    if (slugs.length === 0) {
      return new Response("Missing slug(s)", { status: 400 });
    }

    const candidates = await prisma.candidate.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true, email: true, name: true },
    });
    const foundMap = new Map(candidates.map((c) => [c.slug, c]));
    const results = slugs.map((slug) => {
      const c = foundMap.get(slug);
      return c
        ? { slug, found: true, id: c.id, name: c.name, email: c.email }
        : { slug, found: false };
    });
    return Response.json({ results });
  } catch (err) {
    console.error("/api/admin/cascade-delete GET error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
