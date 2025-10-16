// scripts/list-elections.ts
// Usage examples:
//   npm run script list-elections
//   npm run script list-elections -- --limit 20
//   npm run script list-elections -- --include-hidden

import { PrismaClient } from '@prisma/client';

type Flags = {
  includeHidden: boolean;
  limit?: number;
};

function parseFlags(argv: string[]): Flags {
  let includeHidden = false;
  let limit: number | undefined = undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--include-hidden') includeHidden = true;
    if (a === '--limit') {
      const v = argv[i + 1];
      if (!v || v.startsWith('--')) throw new Error('Missing value after --limit');
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid --limit value');
      limit = Math.floor(n);
      i++;
    }
  }

  return { includeHidden, limit };
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '';
  // Print as YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export async function main(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('List active elections.');
    console.log('Flags:');
    console.log('  --include-hidden   Include hidden elections');
    console.log('  --limit <n>        Limit the number of rows');
    return;
  }

  const { includeHidden, limit } = parseFlags(argv);
  const prisma = new PrismaClient();

  try {
    const where: any = { active: true };
    if (!includeHidden) where.hidden = false;

    const elections = await prisma.election.findMany({
      where,
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
      ...(limit ? { take: limit } : {}),
    });

    if (elections.length === 0) {
      console.log('No elections found.');
      return;
    }

    // Simple table output
    const header = ['id', 'date', 'position', 'city', 'state', 'type', 'hidden', 'createdAt'];
    console.log(header.join('\t'));
    for (const e of elections) {
      console.log(
        [
          e.id,
          fmtDate(e.date as unknown as Date),
          e.position ?? '',
          e.city ?? '',
          e.state ?? '',
          String(e.type ?? ''),
          e.hidden ? 'true' : 'false',
          fmtDate(e.createdAt as unknown as Date),
        ].join('\t')
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

