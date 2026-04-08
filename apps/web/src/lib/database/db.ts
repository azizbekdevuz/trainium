import { PrismaClient } from '@prisma/client';
import { serverLogger } from '../logging/server-logger';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaDevKeepalive?: ReturnType<typeof setInterval>;
  prismaLogHandlers?: boolean;
};

const prismaLogConfig =
  process.env.NODE_ENV === 'development'
    ? [
        { emit: 'event' as const, level: 'error' as const },
        { emit: 'event' as const, level: 'warn' as const },
      ]
    : [{ emit: 'event' as const, level: 'error' as const }];

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogConfig,
  });

if (!globalForPrisma.prismaLogHandlers) {
  globalForPrisma.prismaLogHandlers = true;
  prismaClient.$on('error', (e) => {
    serverLogger.error(
      { event: 'prisma_client_error', target: e.target, message: e.message },
      e.message
    );
  });
  if (process.env.NODE_ENV === 'development') {
    prismaClient.$on('warn', (e) => {
      serverLogger.warn(
        { event: 'prisma_client_warn', target: e.target, message: e.message },
        e.message
      );
    });
  }
}

export const prisma = prismaClient;

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
