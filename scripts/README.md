Scripts Toolkit

Purpose
- Provide a simple, typed way to add and run ad‑hoc project scripts without bloating package.json.

Usage
- List available scripts:
  - `npm run scripts:list`
- Run a script by name:
  - `npm run script <name> -- [args]`
  - Example: `npm run script hello -- --name Sam`
- Scaffold a new script from a template:
  - `npm run script -- --new my-task`

Conventions
- Each script is a TypeScript file under `scripts/` exporting `async function main(argv: string[]): Promise<void>`.
- The runner loads `.env.local` then `.env` so scripts get the same environment as the app.
- File names become command names: `scripts/hello.ts` => `hello`.

Notes
- Scripts execute via `tsx`, so no build step is required.
- Keep scripts small and single‑purpose; if they grow, move shared helpers to `scripts/_utils.ts` and import them.

