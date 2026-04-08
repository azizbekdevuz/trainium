export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }
  const { createServiceLogger } = await import('@repo/logging');
  const log = createServiceLogger('web');
  log.info({ event: 'next_instrumentation_registered' }, 'Next.js instrumentation registered');
}
