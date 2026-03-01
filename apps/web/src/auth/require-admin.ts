import type { Session } from 'next-auth';

/**
 * Returns the session if the user is an admin; otherwise null.
 * Use in API routes and server actions for admin-only endpoints.
 *
 * @example
 * const session = await auth();
 * const adminSession = requireAdminSession(session);
 * if (!adminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export function requireAdminSession(session: Session | null): Session | null {
  if (!session?.user?.id) return null;
  if (session.user.role !== 'ADMIN') return null;
  return session;
}
