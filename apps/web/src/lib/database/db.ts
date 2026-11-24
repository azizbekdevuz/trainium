import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { serverLogger } from '../logging/server-logger';

type AppPrismaClient = PrismaClient<'error' | 'warn'>;

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
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

function connectionTimeoutMillis(connectionString: string): number {
  try {
    const params = new URL(connectionString).searchParams;

    const poolTimeoutRaw = params.get('pool_timeout');
    if (poolTimeoutRaw !== null) {
      const seconds = Number(poolTimeoutRaw);
      if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    }

    const connectTimeoutRaw = params.get('connect_timeout');
    if (connectTimeoutRaw !== null) {
      const seconds = Number(connectTimeoutRaw);
      if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    }
  } catch {
    // Keep the Prisma 6 connection-timeout fallback.
  }

  return 5_000;
}

function createPrismaClient(): AppPrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  // One pg timeout covers both connect and acquire. See connectionTimeoutMillis.
  // Idle lifetime stays at the Prisma 6 default of 300s. Pool size stays at
  // pg's default of 10; this database URL has no connection_limit.
  // sslmode and channel_binding stay in the connection string.
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: connectionTimeoutMillis(connectionString),
    idleTimeoutMillis: 300_000,
  });

  // Prisma 7's client generic defaults LogOpts to never unless the log
  // levels are visible to inference. The cast keeps the existing $on handlers.
  return new PrismaClient({
    adapter,
    log: prismaLogConfig,
  }) as AppPrismaClient;
}

const prismaClient = globalForPrisma.prisma ?? createPrismaClient();

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
      prisma.$queryRaw`SELECT 1`.catch(() => { });
    }, 45_000);
  }
}
