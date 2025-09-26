import { prisma } from "../prisma-client";

const TEST_SLUG = process.env.E2E_CANDIDATE_SLUG || "existing-candidate-slug";

async function deleteSeededCandidate() {
  const candidate = await prisma.candidate.findUnique({
    where: { slug: TEST_SLUG },
    select: { id: true },
  });

  if (!candidate) {
    return;
  }

  const candidateId = candidate.id;

  await prisma.$transaction(async (tx) => {
    await tx.contentBlock.deleteMany({ where: { candidateId } });
    await tx.electionLink.deleteMany({ where: { candidateId } });
    await tx.userValidationRequest.deleteMany({ where: { candidateId } });
    await tx.donation.deleteMany({ where: { candidateId } });
    await tx.endorsement.deleteMany({ where: { candidateId } });
  });

  await prisma.candidate.delete({ where: { id: candidateId } });

  await prisma.election.deleteMany({
    where: {
      candidates: {
        none: {},
      },
      uploadedBy: "test@example.com",
    },
  });
}

export default async function globalTeardown() {
  try {
    await deleteSeededCandidate();
  } finally {
    await prisma.$disconnect();
  }
}
