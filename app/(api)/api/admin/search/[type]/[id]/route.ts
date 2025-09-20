import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/prisma";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";

const candidateDetailQuery = Prisma.validator<Prisma.CandidateDefaultArgs>()({
  include: {
    elections: {
      include: {
        ContentBlock: true,
        election: {
          select: {
            id: true,
            position: true,
            city: true,
            state: true,
            date: true,
            type: true,
            hidden: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    },
    endorsements: {
      select: {
        id: true,
        endorserName: true,
        relationshipDescription: true,
        content: true,
        createdAt: true,
        hidden: true,
      },
      orderBy: { createdAt: "desc" },
    },
    donations: {
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    },
    Testimonial: {
      select: {
        id: true,
        content: true,
        rating: true,
        createdAt: true,
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
  },
});

type CandidateDetailRecord = Prisma.CandidateGetPayload<typeof candidateDetailQuery>;

const electionDetailQuery = Prisma.validator<Prisma.ElectionDefaultArgs>()({
  include: {
    candidates: {
      include: {
        candidate: true,
        ContentBlock: true,
      },
    },
  },
});

type ElectionDetailRecord = Prisma.ElectionGetPayload<typeof electionDetailQuery>;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await requireAdminOrSubAdmin(userId);
  if (!flags) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resolvedParams = await params;
  const entityType = (resolvedParams.type || "").toLowerCase();
  const numericId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
  }

  if (entityType === "candidate") {
    return handleCandidateDetail(numericId);
  }

  if (entityType === "election") {
    return handleElectionDetail(numericId);
  }

  return NextResponse.json({ error: "Unknown entity type" }, { status: 400 });
}

async function handleCandidateDetail(id: number) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      ...candidateDetailQuery,
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const candidateWithRelations = candidate as CandidateDetailRecord;

    return NextResponse.json({
      type: "candidate" as const,
      candidate: {
        id: candidateWithRelations.id,
        name: candidateWithRelations.name,
        slug: candidateWithRelations.slug,
        email: candidateWithRelations.email,
        phone: candidateWithRelations.phone,
        website: candidateWithRelations.website,
        linkedin: candidateWithRelations.linkedin,
        currentRole: candidateWithRelations.currentRole,
        currentCity: candidateWithRelations.currentCity,
        currentState: candidateWithRelations.currentState,
        bio: candidateWithRelations.bio,
        photoUrl: candidateWithRelations.photoUrl,
        status: candidateWithRelations.status,
        verified: candidateWithRelations.verified,
        hidden: candidateWithRelations.hidden,
        donationCount: candidateWithRelations.donationCount,
        history: candidateWithRelations.history,
        createdAt: candidateWithRelations.createdAt.toISOString(),
        updatedAt: candidateWithRelations.updatedAt.toISOString(),
        elections: candidateWithRelations.elections.map((link) => ({
          electionId: link.electionId,
          party: link.party,
          policies: link.policies,
          sources: link.sources,
          additionalNotes: link.additionalNotes,
          votinglink: link.votinglink,
          election: {
            id: link.election.id,
            position: link.election.position,
            city: link.election.city,
            state: link.election.state,
            date: link.election.date.toISOString(),
            type: link.election.type,
            hidden: link.election.hidden,
          },
          contentBlocks: link.ContentBlock.map((block) => ({
            id: block.id,
            order: block.order,
            type: block.type,
            color: block.color,
            level: block.level,
            text: block.text,
            body: block.body,
            listStyle: block.listStyle,
            items: block.items,
            imageUrl: block.imageUrl,
            videoUrl: block.videoUrl,
            caption: block.caption,
            createdAt: block.createdAt.toISOString(),
            updatedAt: block.updatedAt.toISOString(),
          })),
        })),
        endorsements: candidateWithRelations.endorsements.map((endorsement) => ({
          id: endorsement.id,
          name: endorsement.endorserName,
          title: endorsement.relationshipDescription,
          organization: null,
          quote: endorsement.content,
          hidden: endorsement.hidden,
          createdAt: endorsement.createdAt.toISOString(),
        })),
        testimonials: candidateWithRelations.Testimonial.map((testimonial) => ({
          id: testimonial.id,
          content: testimonial.content,
          rating: testimonial.rating,
          vendor: testimonial.vendor,
          createdAt: testimonial.createdAt.toISOString(),
        })),
        donations: candidateWithRelations.donations.map((donation) => ({
          id: donation.id,
          status: donation.status,
          amount:
            donation.amount != null
              ? Number(donation.amount)
              : null,
          createdAt: donation.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to load candidate detail", { id, error });
    return NextResponse.json(
      { error: "Failed to load candidate detail" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await requireAdminOrSubAdmin(userId);
  if (!flags) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.warn("Failed to parse PATCH body", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { hidden, revealCandidates, hideCandidates } = (body ?? {}) as {
    hidden?: unknown;
    revealCandidates?: unknown;
    hideCandidates?: unknown;
  };

  const hiddenProvided = typeof hidden === "boolean";
  const revealLinkedCandidates = Boolean(revealCandidates);
  const hideLinkedCandidates = Boolean(hideCandidates);

  if (revealLinkedCandidates && hideLinkedCandidates) {
    return NextResponse.json(
      { error: "Cannot reveal and hide candidates in the same request." },
      { status: 400 }
    );
  }

  if (!hiddenProvided && !revealLinkedCandidates && !hideLinkedCandidates) {
    return NextResponse.json(
      {
        error:
          "Payload must include a boolean 'hidden' value or set 'revealCandidates'/'hideCandidates' to true.",
      },
      { status: 400 }
    );
  }

  const resolvedParams = await params;
  const entityType = (resolvedParams.type || "").toLowerCase();
  const numericId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
  }

  try {
    if (entityType === "candidate") {
      if (!hiddenProvided) {
        return NextResponse.json(
          { error: "Missing 'hidden' value for candidate update" },
          { status: 400 }
        );
      }

      await prisma.candidate.update({
        where: { id: numericId },
        data: { hidden: hidden as boolean },
      });
      return handleCandidateDetail(numericId);
    }

    if (entityType === "election") {
      if (hiddenProvided) {
        await prisma.election.update({
          where: { id: numericId },
          data: { hidden: hidden as boolean },
        });
      } else {
        const electionExists = await prisma.election.findUnique({
          where: { id: numericId },
          select: { id: true },
        });

        if (!electionExists) {
          return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }
      }

      if (revealLinkedCandidates) {
        await prisma.candidate.updateMany({
          where: {
            elections: {
              some: {
                electionId: numericId,
              },
            },
          },
          data: { hidden: false },
        });
      } else if (hideLinkedCandidates) {
        await prisma.candidate.updateMany({
          where: {
            elections: {
              some: {
                electionId: numericId,
              },
            },
          },
          data: { hidden: true },
        });
      }

      return handleElectionDetail(numericId);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    console.error("Failed to toggle hidden status", {
      entityType,
      numericId,
      hidden,
      revealLinkedCandidates,
      hideLinkedCandidates,
      error,
    });
    return NextResponse.json(
      { error: "Failed to update hidden status" },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "Unknown entity type" }, { status: 400 });
}

async function handleElectionDetail(id: number) {
  try {
    const election = await prisma.election.findUnique({
      where: { id },
      ...electionDetailQuery,
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    const electionWithRelations = election as ElectionDetailRecord;

    return NextResponse.json({
      type: "election" as const,
      election: {
        id: electionWithRelations.id,
        position: electionWithRelations.position,
        city: electionWithRelations.city,
        state: electionWithRelations.state,
        description: electionWithRelations.description,
        date: electionWithRelations.date.toISOString(),
        type: electionWithRelations.type,
        hidden: electionWithRelations.hidden,
        active: electionWithRelations.active,
        createdAt: electionWithRelations.createdAt.toISOString(),
        updatedAt: electionWithRelations.updatedAt.toISOString(),
        candidates: electionWithRelations.candidates.map((link) => ({
          candidateId: link.candidateId,
          candidate: {
            id: link.candidate.id,
            name: link.candidate.name,
            slug: link.candidate.slug,
            email: link.candidate.email,
            phone: link.candidate.phone,
            verified: link.candidate.verified,
            hidden: link.candidate.hidden,
          },
          party: link.party,
          policies: link.policies,
          votinglink: link.votinglink,
          additionalNotes: link.additionalNotes,
          sources: link.sources,
          contentBlocks: link.ContentBlock.map((block) => ({
            id: block.id,
            order: block.order,
            type: block.type,
            level: block.level,
            text: block.text,
            body: block.body,
            listStyle: block.listStyle,
            items: block.items,
            imageUrl: block.imageUrl,
            videoUrl: block.videoUrl,
            caption: block.caption,
            createdAt: block.createdAt.toISOString(),
            updatedAt: block.updatedAt.toISOString(),
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to load election detail", { id, error });
    return NextResponse.json(
      { error: "Failed to load election detail" },
      { status: 500 }
    );
  }
}
