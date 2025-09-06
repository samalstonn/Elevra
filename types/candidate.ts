import {
  Candidate as PrismaCandidate,
  Election as PrismaElection,
  SubmissionStatus,
} from "@prisma/client";

// Type for data needed specifically for the dashboard view/edit
// Adjust based on the actual fields you want to display/edit
export type CandidateDashboardData = Pick<
  PrismaCandidate,
  | "id"
  | "name"
  | "currentRole"
  | "currentCity"
  | "currentState"
  | "bio"
  | "website"
  | "linkedin"
  | "photoUrl" // Assuming you add photoUrl to Candidate model like Vendor
  | "status"
  | "slug"
  | "history"
  // Add any other fields relevant to the dashboard view
> & {
  party?: string;
  /** Profiles vary per election; list of elections this candidate is in */
  elections?: Pick<
    PrismaElection,
    "id" | "position" | "date" | "city" | "state"
  >[];
  // Add subscription status field when implemented
  // subscriptionTier?: string;
};

// types for Analytics data points and Mailing Lists
export interface AnalyticsStat {
  label: string;
  value: string | number;
  change?: number; // Optional change indicator
}
export interface MailingListSummary {
  id: number;
  name: string;
  subscriberCount: number;
  createdAt: Date;
}
