import type { Role } from '@/generated/prisma/enums';

export const isAdmin = (role?: Role | null) => role === 'ADMIN';
export const isStaff = (role?: Role | null) => role === 'STAFF' || role === 'ADMIN';