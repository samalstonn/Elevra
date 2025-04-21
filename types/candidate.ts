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
  | "party"
  | "position"
  | "bio"
  | "website"
  | "linkedin"
  | "votinglink"
  | "additionalNotes"
  | "city"
  | "state"
  | "policies"
  | "photoUrl" // Assuming you add photoUrl to Candidate model like Vendor
  | "status"
  | "electionId"
  | "slug"
  | "photoUrl"
  // Add any other fields relevant to the dashboard view
> & {
  election?: Pick<PrismaElection, "id" | "position" | "date"> | null; // Optional election details
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
