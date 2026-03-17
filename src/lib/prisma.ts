import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Ensures Prisma sees env vars in local dev even when Next hot-reloads.
dotenv.config({ path: '.env.local' });
dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cliente Singleton para evitar múltiples conexiones en desarrollo (Next.js Hot Reload)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
