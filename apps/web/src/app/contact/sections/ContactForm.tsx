'use client';

import { useState } from 'react';
import { useI18n } from '../../../components/providers/I18nProvider';

export function ContactForm() {
  // ── ALL EXISTING LOGIC UNCHANGED ──
  const { dict } = useI18n();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setStatus('submitting');
    setMessage('');

    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      reason: String(formData.get('reason') || ''),
      message: String(formData.get('message') || ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus('success');
        setMessage(dict.pages?.contact?.form?.sent ?? "Your message has been sent. We'll get back to you soon.");
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data?.error || (dict.pages?.contact?.form?.error ?? 'Something went wrong. Please try again later.'));
      }
    } catch {
      setStatus('error');
      setMessage(dict.pages?.contact?.form?.network ?? 'Network error. Please try again.');
    }
  }
  // ── END OF UNCHANGED LOGIC ──

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-[.06em] mb-1.5"
            style={{ color: 'var(--text-faint)' }}
          >
            {dict.pages?.contact?.form?.name ?? 'Name'}
          </label>
          <input
            name="name"
            required
            className="input-field w-full"
            placeholder={dict.pages?.contact?.form?.namePh ?? 'Your full name'}
          />
        </div>
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-[.06em] mb-1.5"
            style={{ color: 'var(--text-faint)' }}
          >
            {dict.pages?.contact?.form?.email ?? 'Email'}
          </label>
          <input
            type="email"
            name="email"
            required
            className="input-field w-full"
            placeholder={dict.pages?.contact?.form?.emailPh ?? 'you@example.com'}
          />
        </div>
      </div>

      <div>
        <label
          className="block text-xs font-semibold uppercase tracking-[.06em] mb-1.5"
          style={{ color: 'var(--text-faint)' }}
        >
          {dict.pages?.contact?.form?.reason ?? 'Reason'}
        </label>
        {/* select-field = input-field + cursor-pointer, defined in components.css */}
        <select name="reason" required className="select-field w-full">
          <option value="Help">{dict.pages?.contact?.form?.reasons?.help ?? 'Help'}</option>
          <option value="Complain">{dict.pages?.contact?.form?.reasons?.complain ?? 'Complain'}</option>
          <option value="Offer">{dict.pages?.contact?.form?.reasons?.offer ?? 'Offer'}</option>
          <option value="Other">{dict.pages?.contact?.form?.reasons?.other ?? 'Other'}</option>
        </select>
      </div>

      <div>
        <label
          className="block text-xs font-semibold uppercase tracking-[.06em] mb-1.5"
          style={{ color: 'var(--text-faint)' }}
        >
          {dict.pages?.contact?.form?.message ?? 'Message'}
        </label>
        <textarea
          name="message"
          required
          rows={5}
          className="input-field w-full"
          style={{ height: 'auto', paddingTop: '10px', paddingBottom: '10px', resize: 'vertical' }}
          placeholder={dict.pages?.contact?.form?.messagePh ?? 'Write your message here...'}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
        <button
          disabled={status === 'submitting'}
          type="submit"
          className="btn-primary h-11 px-6 text-[13.5px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting'
            ? (dict.pages?.contact?.form?.sending ?? 'Sending…')
            : (dict.pages?.contact?.form?.send ?? 'Send Message')}
        </button>

        {message && (
          <p
            className="text-sm font-medium"
            style={{
              color: status === 'success'
                ? '#34d399'  /* emerald — same as chart-series-success token */
                : status === 'error'
                ? '#f87171'  /* red — same as status-stock-out token */
                : 'var(--text-muted)',
            }}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}