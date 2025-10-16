import type { PrismaClient } from '@prisma/client';

// List candidates. By default filters out hidden.
// Usage:
//   npx tsx scripts/runPrisma.ts getCandidates [--include-hidden] [--limit N] [--json]

type Ctx = { prisma: PrismaClient; args: string[] };

export default async function run({ prisma, args }: Ctx) {
  const includeHidden = args.includes('--include-hidden');
  const limitIdx = args.findIndex((a) => a === '--limit');
  const take = limitIdx !== -1 && Number.isFinite(Number(args[limitIdx + 1])) ? Number(args[limitIdx + 1]) : undefined;

  const candidates = await prisma.candidate.findMany({
    where: includeHidden ? undefined : { hidden: false },
    select: {
      id: true,
      name: true,
      slug: true,
      verified: true,
      hidden: true,
      createdAt: true,
      currentCity: true,
      currentState: true,
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return candidates;
}

