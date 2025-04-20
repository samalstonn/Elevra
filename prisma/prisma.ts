// prisma/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // inform TS that `global.prisma` exists and is a PrismaClient
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.NODE_ENV === "production"
            ? process.env.DATABASE_URL_PROD
            : process.env.DATABASE_URL_DEV,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma as PrismaClient;
}

export default prisma;
