import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () =>
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

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma as any;
}

export default prisma;
