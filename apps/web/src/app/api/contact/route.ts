import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '../../../lib/db';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const reason = String(body?.reason || '').trim();
    const message = String(body?.message || '').trim();

    if (!name || !email || !reason || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // pick a random active admin (disabled for free Resend plan)
    // const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true }, take: 20 });
    // const recipient = admins.length > 0 ? admins[Math.floor(Math.random() * admins.length)].email : process.env.SUPPORT_EMAIL;

    // Temporary: always send to verified testing address
    const recipient = 'azizbek.dev.ac@gmail.com';

    const { error } = await resend.emails.send({
      from: 'Trainium Support <onboarding@resend.dev>',
      to: [recipient],
      subject: `Contact Form: ${reason} — from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\nMessage:\n${message}`,
      reply_to: email,
    } as any);

    if (error) {
      console.error('Contact email error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Contact API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


