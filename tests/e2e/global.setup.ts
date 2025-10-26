import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { prisma } from "../prisma-client";

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel: https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async ({}) => {
  await clerkSetup();
  
  // Clean up any leftover test data from previous interrupted runs
  console.log("🧹 Cleaning up leftover test data...");
  
  // Clean up test candidates
  const testCandidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { slug: { contains: 'existing-candidate-slug' } },
        { email: { contains: '@test.elevra' } },
        { name: { contains: 'Existing Candidate' } },
        { name: { contains: 'E2E' } },
        { name: { contains: 'Test' } }
      ]
    },
    select: { id: true }
  });

  for (const candidate of testCandidates) {
    await prisma.$transaction(async (tx) => {
      await tx.contentBlock.deleteMany({ where: { candidateId: candidate.id } });
      await tx.electionLink.deleteMany({ where: { candidateId: candidate.id } });
      await tx.userValidationRequest.deleteMany({ where: { candidateId: candidate.id } });
      await tx.donation.deleteMany({ where: { candidateId: candidate.id } });
      await tx.endorsement.deleteMany({ where: { candidateId: candidate.id } });
      await tx.candidate.delete({ where: { id: candidate.id } });
    });
  }

  // Clean up test elections
  const testElections = await prisma.election.findMany({
    where: {
      OR: [
        { position: { contains: 'E2E' } },
        { city: { contains: 'E2E Test City' } },
        { state: 'ZZ' },
        { uploadedBy: 'test@example.com' }
      ]
    },
    select: { id: true }
  });

  for (const election of testElections) {
    await prisma.$transaction(async (tx) => {
      await tx.contentBlock.deleteMany({ where: { electionId: election.id } });
      await tx.electionLink.deleteMany({ where: { electionId: election.id } });
      await tx.election.delete({ where: { id: election.id } });
    });
  }

  // Clear any test clerkUserId conflicts
  const testClerkUserIds = [
    'user_32IuFZHBgzuDbo2qQKD3kNAi0h5',
    'user_33FY6Y8ppT0oboArCXOe1xY8QGw', 
    'user_33FY8tS3H1cUqPtbjzkrKwAc9Pv',
    'user_33FY9w8VC9D1wOpBfN7DZGKn1HV',
    'user_33FYB99OYfs0qBmoRwWBk9bPkkF'
  ];

  for (const clerkUserId of testClerkUserIds) {
    await prisma.candidate.updateMany({
      where: { clerkUserId },
      data: { clerkUserId: null }
    });
  }

  console.log("✅ Test data cleanup completed");
});

// Touch the prisma client once so any connection errors surface early.
void prisma.$connect();
