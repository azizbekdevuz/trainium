import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),

  // Auth.js / NextAuth
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),

  // Stripe (optional during local dev)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_ENABLED: z.string().optional(),

  // Toss Payments (optional during local dev)
  TOSS_SECRET_KEY: z.string().optional(),
  TOSS_CLIENT_KEY: z.string().optional(),

  // Resend (emails)
  RESEND_API_KEY: z.string().optional(),

  // ISR Revalidate shared secret
  REVALIDATE_SECRET: z.string().optional(),

  // Socket settings
  NEXT_PUBLIC_SOCKET_URL: z.string().optional(),
  SOCKET_ADMIN_SECRET: z.string().optional(),
});

function getAuthSecret(env: Record<string, string | undefined>) {
  return env.AUTH_SECRET ?? env.NEXTAUTH_SECRET;
}

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast in production; warn in development
  const formatted = parsed.error.format();
  const messages = Object.entries(formatted)
    .filter(([key]) => key !== '_errors')
    .map(([key, val]) => `${key}: ${(val as any)._errors?.join(', ')}`)
    .join('\n');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables:\n' + messages);
  } else {
    console.warn('[env] Invalid or missing environment variables (development):\n' + messages);
  }
}

export const env = {
  ...parsed.data,
  AUTH_SECRET_RESOLVED: getAuthSecret(process.env),
};


