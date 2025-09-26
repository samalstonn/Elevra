/*
  Seed ContentBlocks for a candidate using the Johnny Appleseed basic webpage template.

  Usage examples:
    - npx tsx prisma/seed-basicwebpage.ts --slug my-candidate
    - npx tsx prisma/seed-basicwebpage.ts --slug my-candidate --electionId 42
    - npx tsx prisma/seed-basicwebpage.ts --slug my-candidate --force

  Behavior:
    - If --electionId is omitted and the candidate has exactly one election link, uses it.
    - If multiple election links exist, picks the most recent by election date unless --electionId is provided.
    - If ContentBlocks already exist for that link, exits unless --force is provided, in which case it replaces them.
*/

import { PrismaClient } from "@prisma/client";
import { elevraStarterTemplate } from "../app/(templates)/basicwebpage";

type Args = {
  slug?: string;
  electionId?: number;
  force?: boolean;
  dryRun?: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug" || a === "-s") {
      args.slug = argv[++i];
    } else if (a === "--electionId" || a === "-e") {
      const v = argv[++i];
      args.electionId = v ? Number(v) : undefined;
    } else if (a === "--force" || a === "-f") {
      args.force = true;
    } else if (a === "--dry-run" || a === "--dryRun") {
      args.dryRun = true;
    } else if (a.startsWith("--")) {
      // support --slug=foo style
      const [k, v] = a.split("=", 2);
      if (k === "--slug") args.slug = v;
      if (k === "--electionId") args.electionId = v ? Number(v) : undefined;
      if (k === "--force") args.force = true;
      if (k === "--dry-run" || k === "--dryRun") args.dryRun = true;
    }
  }
  return args;
}

const prisma = new PrismaClient();

async function main() {
  const { slug, electionId: cliElectionId, force, dryRun } = parseArgs(
    process.argv
  );
  if (!slug) {
    console.error("Error: --slug is required");
    process.exit(1);
  }

  const candidate = await prisma.candidate.findUnique({
    where: { slug },
  });
  if (!candidate) {
    console.error(`Error: candidate not found for slug '${slug}'`);
    process.exit(1);
  }

  // Resolve election link to seed
  let electionId = cliElectionId ?? undefined;
  if (!electionId) {
    const links = await prisma.electionLink.findMany({
      where: { candidateId: candidate.id },
      include: { election: true },
    });
    if (links.length === 0) {
      console.error(
        `Error: candidate '${slug}' has no election links. Provide --electionId or create a link first.`
      );
      process.exit(1);
    }
    if (links.length === 1) {
      electionId = links[0].electionId;
      console.log(
        `Info: using the only election link (electionId=${electionId}) for candidate '${slug}'.`
      );
    } else {
      // pick most recent by election.date desc
      const sorted = links
        .filter((l) => l.election?.date)
        .sort((a, b) =>
          new Date(b.election.date).getTime() -
          new Date(a.election.date).getTime()
        );
      electionId = (sorted[0] || links[0]).electionId;
      console.log(
        `Info: multiple election links found; using most recent (electionId=${electionId}). Pass --electionId to override.`
      );
    }
  } else {
    // verify the link exists; if not, fail with guidance
    const link = await prisma.electionLink.findUnique({
      where: {
        candidateId_electionId: { candidateId: candidate.id, electionId },
      },
    });
    if (!link) {
      console.error(
        `Error: no ElectionLink for candidate '${slug}' (id=${candidate.id}) and electionId=${electionId}. Create it first or omit --electionId to auto-pick.`
      );
      process.exit(1);
    }
  }

  // Check for existing content blocks
  const existingCount = await prisma.contentBlock.count({
    where: { candidateId: candidate.id, electionId },
  });
  if (existingCount > 0 && !force) {
    console.error(
      `Error: ${existingCount} ContentBlock(s) already exist for candidateId=${candidate.id}, electionId=${electionId}. Re-run with --force to replace.`
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log(
      `[Dry Run] Would seed ${elevraStarterTemplate.length} blocks for candidate '${slug}' (id=${candidate.id}) on electionId=${electionId}.`
    );
    process.exit(0);
  }

  await prisma.$transaction(async (tx) => {
    if (existingCount > 0 && force) {
      await tx.contentBlock.deleteMany({
        where: { candidateId: candidate.id, electionId },
      });
      console.log(
        `Deleted ${existingCount} existing ContentBlock(s) for candidateId=${candidate.id}, electionId=${electionId}.`
      );
    }

    await tx.contentBlock.createMany({
      data: elevraStarterTemplate.map((block) => ({
        ...block,
        candidateId: candidate.id,
        electionId: electionId!,
      })),
    });
  });

  console.log(
    `Seeded ${elevraStarterTemplate.length} ContentBlock(s) for '${slug}' (candidateId=${candidate.id}) on electionId=${electionId}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

