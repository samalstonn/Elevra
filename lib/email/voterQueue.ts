import { after } from "next/server";
import { sendWithResend } from "@/lib/email/resend";
import type { ChangeEventType } from "@prisma/client";
import {
  renderCandidateFollowerEmail,
  renderDailyDigestEmail,
  renderVoterUpdateEmail,
} from "@/lib/email/templates/voterNotifications";

type CandidateFollowerJob = {
  type: "candidate_new_follower";
  candidateEmail: string;
  candidateName: string;
  followerName: string;
  manageUrl: string;
};

type VoterUpdateJob = {
  type: "voter_candidate_update";
  voterEmail: string;
  voterName?: string;
  candidateName: string;
  candidateSlug: string;
  summary: string;
  updateType: ChangeEventType;
  manageUrl: string;
};

type DailyDigestJob = {
  type: "voter_daily_digest";
  voterEmail: string;
  voterName?: string;
  manageUrl: string;
  items: Array<{
    candidateName: string;
    summary: string;
    updateType: ChangeEventType;
    candidateSlug: string;
    occurredAt: Date | string;
  }>;
};

type Job = CandidateFollowerJob | VoterUpdateJob | DailyDigestJob;

const queue: Job[] = [];
let draining = false;

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

const dedupeWindowMs = 10 * 60 * 1000;
const dedupeMap = new Map<string, number>();

export function enqueueEmail(job: Job) {
  const key = dedupeKey(job);
  const now = Date.now();
  const last = dedupeMap.get(key);
  if (last && now - last < dedupeWindowMs) {
    return;
  }
  dedupeMap.set(key, now);
  queue.push(job);
  after(async () => {
    await drain();
  });
}

export function enqueueCandidateFollowerEmail(payload: Omit<CandidateFollowerJob, "type" | "manageUrl"> & { manageUrl?: string }) {
  enqueueEmail({
    type: "candidate_new_follower",
    manageUrl: payload.manageUrl ?? `${appUrl}/dashboard?tab=profile`,
    candidateEmail: payload.candidateEmail,
    candidateName: payload.candidateName,
    followerName: payload.followerName,
  });
}

export function enqueueVoterUpdateEmail(payload: Omit<VoterUpdateJob, "type" | "manageUrl"> & { manageUrl?: string }) {
  enqueueEmail({
    type: "voter_candidate_update",
    manageUrl: payload.manageUrl ?? `${appUrl}/dashboard?tab=profile`,
    voterEmail: payload.voterEmail,
    voterName: payload.voterName,
    candidateName: payload.candidateName,
    candidateSlug: payload.candidateSlug,
    summary: payload.summary,
    updateType: payload.updateType,
  });
}

export function enqueueDailyDigestEmail(payload: Omit<DailyDigestJob, "type" | "manageUrl"> & { manageUrl?: string }) {
  enqueueEmail({
    type: "voter_daily_digest",
    manageUrl: payload.manageUrl ?? `${appUrl}/dashboard?tab=profile`,
    voterEmail: payload.voterEmail,
    voterName: payload.voterName,
    items: payload.items,
  });
}

async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      await dispatch(job);
      recordDryRun(job);
    } catch (error) {
      console.error("[VOTER_EMAIL_QUEUE]", error);
    }
  }
  draining = false;
}

async function dispatch(job: Job) {
  switch (job.type) {
    case "candidate_new_follower": {
      const { subject, html } = renderCandidateFollowerEmail({
        candidateName: job.candidateName,
        followerName: job.followerName,
        manageUrl: job.manageUrl,
        appUrl,
      });
      await sendWithResend({
        to: job.candidateEmail,
        subject,
        html,
      });
      break;
    }
    case "voter_candidate_update": {
      const { subject, html } = renderVoterUpdateEmail({
        voterName: job.voterName,
        candidateName: job.candidateName,
        summary: job.summary,
        candidateUrl: `${appUrl}/candidate/${job.candidateSlug}`,
        manageUrl: job.manageUrl,
        updateType: job.updateType,
      });
      await sendWithResend({
        to: job.voterEmail,
        subject,
        html,
      });
      break;
    }
    case "voter_daily_digest": {
      const { subject, html } = renderDailyDigestEmail({
        voterName: job.voterName,
        items: job.items.map((item) => ({
          ...item,
          candidateUrl: `${appUrl}/candidate/${item.candidateSlug}`,
        })),
        manageUrl: job.manageUrl,
        appUrl,
      });
      await sendWithResend({
        to: job.voterEmail,
        subject,
        html,
      });
      break;
    }
  }
}

function dedupeKey(job: Job) {
  switch (job.type) {
    case "candidate_new_follower":
      return `${job.type}:${job.candidateEmail}`;
    case "voter_candidate_update":
      return `${job.type}:${job.voterEmail}:${job.candidateSlug}:${job.updateType}`;
    case "voter_daily_digest":
      return `${job.type}:${job.voterEmail}`;
  }
}

function recordDryRun(_job: Job) {
  // sendWithResend already records payloads when EMAIL_DRY_RUN_LOG=1.
}
