/*
  Warnings:

  - The values [WHITE] on the enum `TextColor` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TextColor_new" AS ENUM ('BLACK', 'GRAY', 'PURPLE');
ALTER TABLE "public"."ContentBlock" ALTER COLUMN "color" TYPE "public"."TextColor_new" USING ("color"::text::"public"."TextColor_new");
ALTER TYPE "public"."TextColor" RENAME TO "TextColor_old";
ALTER TYPE "public"."TextColor_new" RENAME TO "TextColor";
DROP TYPE "public"."TextColor_old";
COMMIT;
