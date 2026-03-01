import { NextRequest, NextResponse } from 'next/server';
import { auth } from "../../../../../../auth";
import { requireAdminSession } from "../../../../../../auth/require-admin";
import { prisma } from '../../../../../../lib/database/db';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const adminSession = requireAdminSession(session);
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = adminSession.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
  }

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id } = await params;
  const role = typeof body?.role === 'string' ? body.role.trim() : '';

  if (!['ADMIN', 'STAFF', 'CUSTOMER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Block self-role changes
  if (id === userId) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
  }

  // Block demoting the last remaining admin
  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data: { role: role as 'ADMIN' | 'STAFF' | 'CUSTOMER' } });
    return NextResponse.json({ success: true, user: { id: updated.id, role: updated.role } });
  } catch (e) {
    console.error('Failed to update role', e);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}


