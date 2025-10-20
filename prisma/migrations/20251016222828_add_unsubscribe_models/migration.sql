-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."EmailUnsubscribe" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "reason" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailUnsubscribe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailUnsubscribe_email_idx" ON "public"."EmailUnsubscribe"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailUnsubscribe_email_scope_key" ON "public"."EmailUnsubscribe"("email", "scope");
