import { z } from 'zod';

/**
 * Server-side construction of mailto: URIs after validation.
 * OWASP / CWE-601: avoid passing unvalidated user input into navigation targets;
 * RFC 6068: use query encoding via URLSearchParams for subject lines.
 */
const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .refine((v) => !/[\r\n\0]/.test(v), { message: 'Invalid email' });

export type ContactMailtoHrefs = { mailtoHref: string; replyMailtoHref: string };

export function buildContactMailtoHrefs(input: {
  email: string;
  reasonForSubject: string;
}): ContactMailtoHrefs | null {
  const emailResult = emailSchema.safeParse(input.email);
  if (!emailResult.success) return null;

  const safeEmail = emailResult.data;
  const subject = `Re: ${input.reasonForSubject}`.slice(0, 200);
  const params = new URLSearchParams();
  params.set('subject', subject);
  const replyMailtoHref = `mailto:${safeEmail}?${params.toString()}`;
  const mailtoHref = `mailto:${safeEmail}`;
  return { mailtoHref, replyMailtoHref };
}
