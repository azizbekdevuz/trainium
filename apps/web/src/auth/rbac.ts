import type { Role } from '@prisma/client';

export const isAdmin = (role?: Role | null) => role === 'ADMIN';
export const isStaff = (role?: Role | null) => role === 'STAFF' || role === 'ADMIN';