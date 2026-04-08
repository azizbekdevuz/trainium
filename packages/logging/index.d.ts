import type { Logger } from 'pino';

export type { Logger };
export function createServiceLogger(serviceName: string): Logger;
