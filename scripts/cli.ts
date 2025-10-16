import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

// Load env (local overrides)
for (const p of ['.env.local', '.env']) {
  const full = path.join(process.cwd(), p);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: false });
  }
}

type ScriptModule = {
  main?: (argv: string[]) => Promise<void> | void;
  default?: (argv: string[]) => Promise<void> | void;
};

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');
const RESERVED = new Set(['cli', '_utils']);

function listScripts(): string[] {
  if (!fs.existsSync(SCRIPTS_DIR)) return [];
  return fs
    .readdirSync(SCRIPTS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
    .filter((name) => !RESERVED.has(name));
}

function usage(): never {
  const names = listScripts();
  console.log('Usage: npm run script <name> -- [args]');
  console.log('       npm run script -- --list');
  console.log('       npm run script -- --new <name>');
  if (names.length) console.log(`\nAvailable: ${names.sort().join(', ')}`);
  process.exit(1);
}

async function run() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) usage();

  const first = argv[0];
  if (first === '--list' || first === '-l') {
    const names = listScripts();
    names.forEach((n) => console.log(n));
    return;
  }

  if (first === '--new' || first === 'new' || first === '--scaffold') {
    const name = argv[1];
    if (!name || /[^a-z0-9-]/i.test(name) || RESERVED.has(name)) {
      console.error('Provide a script name: letters, numbers, dashes.');
      process.exit(1);
    }
    const fp = path.join(SCRIPTS_DIR, `${name}.ts`);
    if (fs.existsSync(fp)) {
      console.error(`scripts/${name}.ts already exists.`);
      process.exit(1);
    }
    if (!fs.existsSync(SCRIPTS_DIR)) fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
    const template = `// scripts/${name}.ts\n// Usage: npm run script ${name} -- [args]\nexport async function main(argv: string[]) {\n  if (argv.includes('--help')) {\n    console.log('Usage: npm run script ${name} -- [--flag value]');\n    return;\n  }\n  console.log('Running ${name} with argv:', argv);\n}\n`;
    fs.writeFileSync(fp, template, 'utf8');
    console.log(`Created scripts/${name}.ts`);
    return;
  }

  const name = first;
  const scriptPath = path.join(SCRIPTS_DIR, `${name}.ts`);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: scripts/${name}.ts`);
    usage();
  }

  const modUrl = pathToFileURL(scriptPath).href;
  const mod: ScriptModule = await import(modUrl);
  const fn = mod.main || mod.default;
  if (!fn) {
    console.error(`scripts/${name}.ts must export a 'main(argv: string[])' function.`);
    process.exit(1);
  }
  const rest = argv.slice(1);
  await Promise.resolve(fn(rest));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

