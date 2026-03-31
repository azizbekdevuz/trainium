/**
 * Minimal structured logs for public upload storage (no secrets).
 * One JSON object per line for grep-friendly production logs.
 */
const COMPONENT = 'public-storage';

export function storageLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, string | number | boolean | undefined> = {}
): void {
  const line = JSON.stringify({
    component: COMPONENT,
    level,
    event,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
