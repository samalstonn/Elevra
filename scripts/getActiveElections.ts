import type { PrismaClient } from '@prisma/client';

// List active elections. Hidden are excluded by default.
// Usage:
//   npx tsx scripts/runPrisma.ts getActiveElections [--include-hidden] [--limit N] [--json]

type Ctx = { prisma: PrismaClient; args: string[] };

export default async function run({ prisma, args }: Ctx) {
  const includeHidden = args.includes('--include-hidden');
  const limitIdx = args.findIndex((a) => a === '--limit');
  const take = limitIdx !== -1 && Number.isFinite(Number(args[limitIdx + 1])) ? Number(args[limitIdx + 1]) : undefined;

  const elections = await prisma.election.findMany({
    where: {
      active: true,
      ...(includeHidden ? {} : { hidden: false }),
    },
    select: {
      id: true,
      position: true,
      date: true,
      city: true,
      state: true,
      type: true,
      hidden: true,
      createdAt: true,
    },
    orderBy: { date: 'asc' },
    take,
  });

  return elections;
}

