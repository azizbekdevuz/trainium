import { describe, it, expect } from 'vitest';
import { requireAdminSession } from './require-admin';

describe('requireAdminSession', () => {
  it('returns null for null session', () => {
    expect(requireAdminSession(null)).toBeNull();
  });

  it('returns null for session without user', () => {
    expect(requireAdminSession({ user: undefined, expires: '' } as any)).toBeNull();
  });

  it('returns null for session without user.id', () => {
    expect(requireAdminSession({ user: { role: 'ADMIN' }, expires: '' } as any)).toBeNull();
  });

  it('returns null for non-admin role', () => {
    expect(
      requireAdminSession({
        user: { id: 'u1', role: 'CUSTOMER' },
        expires: '',
      } as any)
    ).toBeNull();
  });

  it('returns session for admin', () => {
    const session = {
      user: { id: 'u1', role: 'ADMIN' as const },
      expires: '',
    };
    expect(requireAdminSession(session))?.toMatchObject({ user: { id: 'u1', role: 'ADMIN' } });
  });
});
