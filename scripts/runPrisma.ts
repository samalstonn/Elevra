// Quick Prisma script runner
// Usage:
//   npx tsx scripts/runPrisma.ts getCandidates [--json]
//   npx ts-node --esm scripts/runPrisma.ts getCandidates [--json]
//
// Notes:
// - Ensure Prisma Client is generated: `npx prisma generate`
// - Scripts should export a default async function with signature:
//     (ctx: { prisma: PrismaClient; args: string[] }) => Promise<unknown>

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RunnerCtx = {
  prisma: PrismaClient;
  args: string[];
};

async function listAvailableScripts(): Promise<string[]> {
  const all = await fs.promises.readdir(__dirname);
  return all
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .filter((f) => f !== path.basename(__filename))
    .map((f) => f.replace(/\.(ts|tsx)$/i, ''))
    .sort();
}

async function main() {
  const [, , scriptName, ...args] = process.argv;

  if (!scriptName || ['-h', '--help', 'help'].includes(scriptName)) {
    const available = await listAvailableScripts();
    console.log('Prisma script runner');
    console.log('Usage:');
    console.log('  npx tsx scripts/runPrisma.ts <script> [args...]');
    console.log('  npx ts-node --esm scripts/runPrisma.ts <script> [args...]');
    console.log('\nAvailable scripts:');
    for (const s of available) console.log(`  - ${s}`);
    process.exit(scriptName ? 0 : 1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  let exitCode = 0;
  try {
    const scriptPath = path.resolve(__dirname, `${scriptName}.ts`);
    const exists = fs.existsSync(scriptPath);
    if (!exists) {
      const available = await listAvailableScripts();
      console.error(`Script not found: ${scriptName}`);
      if (available.length) {
        console.error('Available scripts:');
        for (const s of available) console.error(`  - ${s}`);
      }
      process.exit(1);
    }

    const moduleUrl = pathToFileURL(scriptPath).href;
    const mod = await import(moduleUrl);
    const run: (ctx: RunnerCtx) => Promise<unknown> = mod.default;
    if (typeof run !== 'function') {
      throw new Error(`Default export is not a function in ${scriptName}.ts`);
    }

    const result = await run({ prisma, args });

    // If the script returned something, print it by default.
    if (typeof result !== 'undefined') {
      // Respect --json flag if present
      if (args.includes('--json')) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        // Fallback pretty print
        if (Array.isArray(result)) {
          // console.table for arrays of objects
          // eslint-disable-next-line no-console
          console.table(result);
        } else {
          // eslint-disable-next-line no-console
          console.dir(result, { depth: 4, colors: true });
        }
      }
    }
  } catch (err) {
    exitCode = 1;
    console.error('\nScript failed with error:');
    console.error(err);
  } finally {
    await prisma.$disconnect().catch(() => {});
    process.exit(exitCode);
  }
}

void main();

