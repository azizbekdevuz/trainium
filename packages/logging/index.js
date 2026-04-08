import pino from 'pino';

/** @type {string[]} */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  '*.password',
  'password',
  'secret',
  '*.secret',
  'stripeSignature',
  'authorization',
  'cookie',
];

/**
 * Pretty output for humans (TTY / local ops). JSON stays the default in production
 * for log aggregators (Docker, Loki, CloudWatch). See Pino + pino-pretty:
 * https://github.com/pinojs/pino/blob/master/docs/pretty.md
 * https://github.com/pinojs/pino-pretty#options
 */
function shouldUsePrettyTransport(isProd) {
  if (process.env.LOG_JSON === 'true') return false;
  if (process.env.LOG_PRETTY === 'true') return true;
  if (process.env.LOG_PRETTY === 'false') return false;
  if (!isProd) return true;
  return Boolean(process.stdout.isTTY && process.env.LOG_PRETTY !== 'false');
}

/**
 * Options must be JSON-serializable: Pino runs this target in a Worker (thread-stream)
 * and postMessage cannot clone functions — custom messageFormat callbacks cause DataCloneError.
 * https://github.com/pinojs/pino/blob/master/docs/transports.md
 */
function createPrettyTransport() {
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      colorizeObjects: true,
      singleLine: false,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      errorLikeObjectKeys: ['err', 'error'],
    },
  };
}

/**
 * @param {string} serviceName
 * @returns {import('pino').Logger}
 */
export function createServiceLogger(serviceName) {
  const isProd = process.env.NODE_ENV === 'production';
  const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

  const baseOpts = {
    level,
    base: {
      service: serviceName,
      env: process.env.NODE_ENV || 'development',
    },
    redact: {
      paths: REDACT_PATHS,
      censor: '[Redacted]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (shouldUsePrettyTransport(isProd)) {
    return pino({
      ...baseOpts,
      transport: createPrettyTransport(),
    });
  }

  return pino(baseOpts);
}
