// Helper functions for candidate outreach scheduling

/**
 * Build a timezone-aware ISO string with the user's local offset
 * Example output: 2025-09-15T14:30:00-04:00
 */
export function buildScheduledIso(
  scheduleDate: string,
  scheduleTime: string
): string | undefined {
  if (!scheduleDate || !scheduleTime) return undefined;
  const [y, m, d] = scheduleDate.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = scheduleTime.split(":").map((s) => parseInt(s, 10));
  if (
    Number.isFinite(y) &&
    Number.isFinite(m) &&
    Number.isFinite(d) &&
    Number.isFinite(hh) &&
    Number.isFinite(mm)
  ) {
    const local = new Date(y, (m as number) - 1, d as number, hh as number, mm as number, 0, 0);
    if (!Number.isNaN(local.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const yyyy = y;
      const MM = pad(m as number);
      const DD = pad(d as number);
      const HH = pad(hh as number);
      const Min = pad(mm as number);
      const sec = "00";
      const offMin = -local.getTimezoneOffset();
      const sign = offMin >= 0 ? "+" : "-";
      const abs = Math.abs(offMin);
      const offH = pad(Math.floor(abs / 60));
      const offM = pad(abs % 60);
      return `${yyyy}-${MM}-${DD}T${HH}:${Min}:${sec}${sign}${offH}:${offM}`;
    }
  }
  return undefined;
}

/**
 * Build a friendly display string for when the emails will be sent,
 * using the user's local timezone. Returns "immediately" if not scheduled.
 */
export function buildScheduleDisplay(
  scheduleDate: string,
  scheduleTime: string
): string {
  if (!scheduleDate || !scheduleTime) return "immediately";
  const [y, m, d] = scheduleDate.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = scheduleTime.split(":").map((s) => parseInt(s, 10));
  const local = new Date(y, (m as number) - 1, d as number, hh as number, mm as number, 0, 0);
  if (Number.isNaN(local.getTime())) return "immediately";
  const dateStr = local.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const tzOffsetMin = -local.getTimezoneOffset();
  const sign = tzOffsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(tzOffsetMin);
  const offH = String(Math.floor(abs / 60)).padStart(2, "0");
  const offM = String(abs % 60).padStart(2, "0");
  return `${dateStr} (GMT${sign}${offH}:${offM})`;
}

