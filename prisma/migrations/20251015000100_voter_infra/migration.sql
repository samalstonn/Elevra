-- Create supporting enum types
CREATE TYPE "ChangeEventType" AS ENUM ('BIO', 'EDUCATION', 'PHOTO', 'CAMPAIGN');
CREATE TYPE "NotificationType" AS ENUM ('CANDIDATE_UPDATE');
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');
CREATE TYPE "EmailMode" AS ENUM ('IMMEDIATE', 'DAILY_DIGEST', 'OFF');

-- Core voter profile table
CREATE TABLE "Voter" (
    "id" SERIAL PRIMARY KEY,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Voter_clerkUserId_key" ON "Voter"("clerkUserId");

-- Follows join table
CREATE TABLE "Follow" (
    "voterId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("voterId", "candidateId"),
    CONSTRAINT "Follow_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Candidate change events captured for feeds/notifications
CREATE TABLE "ChangeEvent" (
    "id" SERIAL PRIMARY KEY,
    "candidateId" INTEGER NOT NULL,
    "type" "ChangeEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeEvent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ChangeEvent_candidateId_idx" ON "ChangeEvent"("candidateId");

-- Notifications tied to change events
CREATE TABLE "Notification" (
    "id" SERIAL PRIMARY KEY,
    "voterId" INTEGER NOT NULL,
    "changeEventId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "Notification_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_changeEventId_fkey" FOREIGN KEY ("changeEventId") REFERENCES "ChangeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Notification_voterId_idx" ON "Notification"("voterId");
CREATE INDEX "Notification_changeEventId_idx" ON "Notification"("changeEventId");
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- Email preference settings per voter
CREATE TABLE "VoterPreference" (
    "id" SERIAL PRIMARY KEY,
    "voterId" INTEGER NOT NULL,
    "emailMode" "EmailMode" NOT NULL DEFAULT 'IMMEDIATE',
    "notifyBio" BOOLEAN NOT NULL DEFAULT TRUE,
    "notifyEducation" BOOLEAN NOT NULL DEFAULT TRUE,
    "notifyPhoto" BOOLEAN NOT NULL DEFAULT TRUE,
    "notifyCampaign" BOOLEAN NOT NULL DEFAULT TRUE,
    "dailyDigestHour" INTEGER,
    "lastDigestSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoterPreference_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "VoterPreference_voterId_key" ON "VoterPreference"("voterId");
