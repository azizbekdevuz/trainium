import { NextRequest, NextResponse } from 'next/server';
import { auth } from "../../../../../../auth"
import { prisma } from '../../../../../../lib/db';


export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { role } = await req.json();

  if (!['ADMIN','STAFF','CUSTOMER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json({ success: true, user: { id: updated.id, role: updated.role } });
  } catch (e) {
    console.error('Failed to update role', e)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}


