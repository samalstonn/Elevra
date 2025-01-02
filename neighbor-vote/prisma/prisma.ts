import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, always create a new PrismaClient instance
  prisma = new PrismaClient();
} else {
  // In development, reuse a single PrismaClient instance
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
