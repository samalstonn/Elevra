-- CreateTable
CREATE TABLE "public"."EmailClick" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "template" TEXT,
    "targetUrl" TEXT NOT NULL,
    "targetHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailClick_email_idx" ON "public"."EmailClick"("email");

-- CreateIndex
CREATE INDEX "EmailClick_scope_idx" ON "public"."EmailClick"("scope");

-- CreateIndex
CREATE INDEX "EmailClick_targetHash_idx" ON "public"."EmailClick"("targetHash");

