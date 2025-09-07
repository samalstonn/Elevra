// Shared Prisma client for the app
// Reuse the singleton from prisma/prisma.ts to avoid connection churn in dev
export { default as prisma } from "../prisma/prisma";
