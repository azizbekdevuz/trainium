import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaDevKeepalive?: ReturnType<typeof setInterval>;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Handle graceful shutdown in production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  // Long-running `pnpm dev`: Postgres often closes idle pool
  // light keepalive reduces that without affecting production.
  if (!globalForPrisma.prismaDevKeepalive) {
    globalForPrisma.prismaDevKeepalive = setInterval(() => {
      prisma.$queryRaw`SELECT 1`.catch(() => {});
    }, 45_000);
  }
}