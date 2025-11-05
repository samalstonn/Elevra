// Client-safe election date utility (no Prisma imports)
// Treat elections as active on and up to two days after their scheduled date.
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

  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
  const electionWithGraceUTC = electionUTC + twoDaysInMs;

  return electionWithGraceUTC >= todayUTC;
}

export default isElectionActive;
