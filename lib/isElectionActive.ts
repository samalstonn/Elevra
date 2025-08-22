// Client-safe election date utility (no Prisma imports)
export function isElectionActive(electionDate: Date): boolean {
  const today = new Date();
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const electionUTC = Date.UTC(
    electionDate.getUTCFullYear(),
    electionDate.getUTCMonth(),
    electionDate.getUTCDate()
  );
  return electionUTC >= todayUTC;
}

export default isElectionActive;
