import { prisma } from '@/lib/prisma';

export type TaskParam = {
  name: string;
  label?: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  placeholder?: string;
};

export type ExampleSpec = { label: string; args: Record<string, unknown> };

export type TaskSpec = {
  key: string; // unique id, used to invoke
  title: string;
  description?: string;
  params?: TaskParam[];
  run: (args: Record<string, unknown>) => Promise<unknown>;
  // Optional: restrict to full admins only
  adminOnly?: boolean;
  examples?: ExampleSpec[];
};


// Task: List active elections
const listElections: TaskSpec = {
  key: 'list-elections',
  title: 'List Active Elections',
  description:
    'Returns active elections ordered by date. Toggle hidden and limit the count.',
  params: [
    { name: 'includeHidden', type: 'boolean', label: 'Include Hidden' },
    { name: 'limit', type: 'number', label: 'Limit', placeholder: 'e.g. 50' },
  ],
  examples: [
    { label: 'First 10', args: { limit: 10 } },
    { label: 'Include hidden', args: { includeHidden: true, limit: 10 } },
  ],
  async run(args) {
    const includeHidden = Boolean(args.includeHidden);
    const limitRaw = Number(args.limit ?? 0);
    const take = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : undefined;

    const where: any = { active: true };
    if (!includeHidden) where.hidden = false;

    const rows = await prisma.election.findMany({
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
      ...(take ? { take } : {}),
    });
    return rows;
  },
};

// Example utility task
const ping: TaskSpec = {
  key: 'ping',
  title: 'Ping',
  description: 'Verify the Scripts Runner is working',
  params: [{ name: 'message', type: 'string', placeholder: 'Hello world' }],
  examples: [
    { label: 'Default', args: {} },
    { label: 'Custom message', args: { message: 'Hello from admin' } },
  ],
  async run(args) {
    return { ok: true, message: String(args.message ?? 'pong') };
  },
};

// DB info / health check
const dbInfo: TaskSpec = {
  key: 'db-info',
  title: 'Database Info',
  description: 'Returns database time, timezone, version, and entity counts.',
  async run() {
    const [nowRow] = (await prisma.$queryRawUnsafe<any[]>(
      `SELECT NOW() as now, current_setting('TimeZone') as timezone, version()`
    )) as any[];
    const [elections, candidates] = await Promise.all([
      prisma.election.count(),
      prisma.candidate.count(),
    ]);
    return {
      now: nowRow?.now,
      timezone: nowRow?.timezone,
      version: nowRow?.version,
      counts: { elections, candidates },
    };
  },
};

// Search candidates by name (case-insensitive)
const searchCandidates: TaskSpec = {
  key: 'search-candidates',
  title: 'Search Candidates',
  description: 'Find candidates by name (partial, case-insensitive).',
  params: [
    { name: 'q', type: 'string', label: 'Query', placeholder: 'e.g. Smith' },
    { name: 'limit', type: 'number', label: 'Limit', placeholder: 'e.g. 20' },
  ],
  examples: [
    { label: 'Search "john"', args: { q: 'john', limit: 10 } },
  ],
  async run(args) {
    const q = String(args.q ?? '').trim();
    const limitRaw = Number(args.limit ?? 20);
    const take = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 20;
    if (!q) return [];
    const rows = await prisma.candidate.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true, verified: true, hidden: true },
      orderBy: { name: 'asc' },
      take,
    });
    return rows;
  },
};

// Recently created elections
const recentElections: TaskSpec = {
  key: 'recent-elections',
  title: 'Recent Elections',
  description: 'Latest created elections (optionally include hidden).',
  params: [
    { name: 'includeHidden', type: 'boolean', label: 'Include Hidden' },
    { name: 'limit', type: 'number', label: 'Limit', placeholder: 'e.g. 25' },
  ],
  examples: [
    { label: 'Latest 10', args: { limit: 10 } },
  ],
  async run(args) {
    const includeHidden = Boolean(args.includeHidden);
    const limitRaw = Number(args.limit ?? 25);
    const take = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 25;
    const rows = await prisma.election.findMany({
      where: includeHidden ? {} : { hidden: false },
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
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows;
  },
};

export const tasks: TaskSpec[] = [dbInfo, listElections, recentElections, searchCandidates, ping];

export function getTask(key: string): TaskSpec | undefined {
  return tasks.find((t) => t.key === key);
}
