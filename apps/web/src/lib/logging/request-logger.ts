import { headers } from 'next/headers';
import type { Logger } from '@repo/logging';
import { serverLogger } from './server-logger';

/**
 * Request-scoped logger (Node runtime). Requires `x-request-id` from middleware.
 */
export async function getRequestLogger(): Promise<Logger> {
  const h = await headers();
  const requestId = h.get('x-request-id');
  if (requestId) {
    return serverLogger.child({ requestId });
  }
  return serverLogger;
}
