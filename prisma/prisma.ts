import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: 
        process.env.NODE_ENV === 'production'
          ? process.env.DATABASE_URL_PROD
          : 
          process.env.DATABASE_URL_DEV,
      },
    },
  });
};

const prisma = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;