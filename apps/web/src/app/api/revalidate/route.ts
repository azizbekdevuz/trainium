import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const secret = req.headers.get('x-revalidate-secret') || body.secret;

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const path = typeof body.path === 'string' ? body.path : '/';
  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to revalidate' }, { status: 500 });
  }
}


