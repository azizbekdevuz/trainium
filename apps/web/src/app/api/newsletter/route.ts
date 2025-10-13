import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
  }

  // MVP: just log. Later: push to Resend/EmailOctopus/PostHog/DB table.
  console.log('[newsletter] new subscriber:', email);

  return NextResponse.redirect(new URL('/?joined=1', req.url), { status: 303 });
}