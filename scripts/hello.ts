// scripts/hello.ts
// Usage: npm run script hello -- --name Sam

export async function main(argv: string[]) {
  const idx = argv.indexOf('--name');
  const name = idx >= 0 ? argv[idx + 1] : undefined;
  console.log(`Hello${name ? `, ${name}` : ''}! ENV URL: ${process.env.NEXT_PUBLIC_APP_URL ?? '(not set)'}`);
}

