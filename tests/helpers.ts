import { elevraStarterTemplate } from "@/app/(templates)/basicwebpage";
import { promises as fs } from "node:fs";
import { expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { colorClass } from "@/lib/constants";

const EMAIL_LOG = path.join(process.cwd(), "lib/email/logs/.test-emails.log");

// Helper: assert seeded link contains elevraStarterTemplate blocks
export async function expectHasElevraStarterTemplateBlocks(
  prisma: PrismaClient,
  seededCandidateId: number | null,
  seededElectionId: number | null
) {
  expect(seededCandidateId).toBeTruthy();
  expect(seededElectionId).toBeTruthy();

  // Wait up to 1s for blocks to exist, then fail
  const deadline = Date.now() + 1000;
  let lastCount = 0;
  const expected = elevraStarterTemplate.length;
  while (Date.now() < deadline) {
    lastCount = await prisma.contentBlock.count({
      where: { candidateId: seededCandidateId!, electionId: seededElectionId! },
    });
    if (lastCount === expected) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  expect(lastCount).toBe(expected);

  // Spot-check first block
  const first = await prisma.contentBlock.findFirst({
    where: {
      candidateId: seededCandidateId!,
      electionId: seededElectionId!,
      order: 0,
    },
  });
  expect(first?.type).toBe(elevraStarterTemplate[0].type);
  const tmpl0 = elevraStarterTemplate[0] as { text?: string };
  if (tmpl0.text) {
    expect(first?.text?.trim()).toBe(tmpl0.text);
  }
}

// Helper: assert all blocks for a candidate and election have the expected color
export async function expectBlockToHaveColor(
  prisma: PrismaClient,
  blockId: number,
  expectedColor: string
) {
  const block = await prisma.contentBlock.findUnique({
    where: { id: blockId },
  });

  expect(block).toBeTruthy();

  if (block!.type !== "IMAGE") {
    expect(block!.color).toBe(expectedColor);
  }
}

export async function expectBlocksHaveColor(
  prisma: PrismaClient,
  seededCandidateId: number | null,
  seededElectionId: number | null,
  expectedColor: string
) {
  expect(seededCandidateId).toBeTruthy();
  expect(seededElectionId).toBeTruthy();

  const blocks = await prisma.contentBlock.findMany({
    where: { candidateId: seededCandidateId!, electionId: seededElectionId! },
  });

  for (const block of blocks) {
    if (block.type === "IMAGE" || block.type === "VIDEO") {
      continue;
    }
    expect(block!.color).toBe(expectedColor);
  }
}

// Helper: get all content block IDs for a candidate and election
export async function getCandidateBlockIds(
  prisma: PrismaClient,
  seededCandidateId: number | null,
  seededElectionId: number | null
): Promise<number[]> {
  expect(seededCandidateId).toBeTruthy();
  expect(seededElectionId).toBeTruthy();

  const blocks = await prisma.contentBlock.findMany({
    where: { candidateId: seededCandidateId!, electionId: seededElectionId! },
    select: { id: true },
  });

  return blocks.map((block) => block.id);
}

// Helper: assert no template content blocks are present yet
export async function expectNoTemplateBlocks(
  seededCandidateId: number | null,
  seededElectionId: number | null,
  prisma: PrismaClient
) {
  expect(seededCandidateId).toBeTruthy();
  expect(seededElectionId).toBeTruthy();
  const count = await prisma.contentBlock.count({
    where: { candidateId: seededCandidateId!, electionId: seededElectionId! },
  });
  expect(count).toBe(0);
}

export async function readEmailLog(): Promise<string> {
  try {
    return await fs.readFile(EMAIL_LOG, "utf8");
  } catch {
    return "";
  }
}

export async function expectEmailLogged(subjectSnippet: string) {
  const deadline = Date.now() + 1500;
  let text = "";
  while (Date.now() < deadline) {
    text = await readEmailLog();
    if (text.includes(subjectSnippet)) {
      expect(text).toContain(subjectSnippet);
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Email log did not contain expected snippet within timeout: "${subjectSnippet}"`
  );
}
