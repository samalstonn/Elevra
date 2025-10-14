import type { Candidate } from "@prisma/client";
import type { ChangeEventType } from "@prisma/client";

type ChangeSummary = {
  type: ChangeEventType;
  summary: string;
  metadata?: Record<string, unknown>;
};

export function detectCandidateProfileChanges(
  before: Candidate,
  after: Candidate
): ChangeSummary[] {
  const updates: ChangeSummary[] = [];

  if (before.bio !== after.bio) {
    updates.push({
      type: "BIO",
      summary: buildSummary(
        "Bio updated",
        after.bio
      ),
      metadata: {
        previousLength: before.bio?.length ?? 0,
        nextLength: after.bio?.length ?? 0,
      },
    });
  }

  if (before.photo !== after.photo || before.photoUrl !== after.photoUrl) {
    updates.push({
      type: "PHOTO",
      summary: "Profile photo refreshed",
    });
  }

  if (
    before.currentRole !== after.currentRole ||
    before.currentCity !== after.currentCity ||
    before.currentState !== after.currentState
  ) {
    updates.push({
      type: "CAMPAIGN",
      summary: "Campaign profile details updated",
      metadata: {
        role: after.currentRole,
        city: after.currentCity,
        state: after.currentState,
      },
    });
  }

  return updates;
}

export function buildSummary(prefix: string, body?: string | null) {
  if (!body) return prefix;
  const plain = body.replace(/\s+/g, " ").trim();
  if (!plain) return prefix;
  const excerpt = plain.slice(0, 120);
  return `${prefix}: ${excerpt}${plain.length > 120 ? "…" : ""}`;
}

