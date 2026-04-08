import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { buildContactMailtoHrefs } from '@/lib/email/mailto-url';
import { serverLogger } from '@/lib/logging/server-logger';

export const runtime = 'nodejs';

const contactBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  reason: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10_000),
});

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(key);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = contactBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, email, reason, message } = parsed.data;

    const mailto = buildContactMailtoHrefs({ email, reasonForSubject: reason });
    if (!mailto) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Temporary: always send to verified testing address
    const recipient = 'azizbek.dev.ac@gmail.com';

    const { ContactFormEmail } = await import('../../../emails/ContactFormEmail');
    const { error } = await getResend().emails.send({
      from: 'Trainium Support <onboarding@resend.dev>',
      to: [recipient],
      subject: `Contact Form: ${reason} — from ${name}`,
      react: ContactFormEmail({
        name,
        email,
        reason,
        message,
        mailtoHref: mailto.mailtoHref,
        replyMailtoHref: mailto.replyMailtoHref,
      }),
      replyTo: email,
    });

    if (error) {
      serverLogger.error({ err: error, event: 'contact_email_failed' }, 'Contact form email failed');
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    serverLogger.error({ err: e, event: 'contact_api_error' }, 'Contact API error');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
