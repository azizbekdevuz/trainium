'use client';

import { useState } from 'react';
import { useI18n } from '../../../components/providers/I18nProvider';

export function ContactForm() {
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{dict.pages?.contact?.form?.name ?? 'Name'}</label>
          <input name="name" required className="h-11 w-full rounded-xl border px-3" placeholder={dict.pages?.contact?.form?.namePh ?? 'Your full name'} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{dict.pages?.contact?.form?.email ?? 'Email'}</label>
          <input type="email" name="email" required className="h-11 w-full rounded-xl border px-3" placeholder={dict.pages?.contact?.form?.emailPh ?? 'you@example.com'} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{dict.pages?.contact?.form?.reason ?? 'Reason'}</label>
        <select name="reason" required className="h-11 w-full rounded-xl border px-3">
          <option value="Help">{dict.pages?.contact?.form?.reasons?.help ?? 'Help'}</option>
          <option value="Complain">{dict.pages?.contact?.form?.reasons?.complain ?? 'Complain'}</option>
          <option value="Offer">{dict.pages?.contact?.form?.reasons?.offer ?? 'Offer'}</option>
          <option value="Other">{dict.pages?.contact?.form?.reasons?.other ?? 'Other'}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{dict.pages?.contact?.form?.message ?? 'Message'}</label>
        <textarea name="message" required rows={5} className="w-full rounded-xl border px-3 py-2" placeholder={dict.pages?.contact?.form?.messagePh ?? 'Write your message here...'} />
      </div>
      <div className="flex items-center gap-3">
        <button disabled={status === 'submitting'} type="submit" className="h-11 px-6 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-50">
          {status === 'submitting' ? (dict.pages?.contact?.form?.sending ?? 'Sending…') : (dict.pages?.contact?.form?.send ?? 'Send Message')}
        </button>
        {message && (
          <div className={`text-sm ${status === 'success' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{message}</div>
        )}
      </div>
    </form>
  );
}


