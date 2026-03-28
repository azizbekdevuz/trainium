import Link from 'next/link';
import { ContactForm } from './sections/ContactForm';
import { FaqSection } from './sections/FaqSection';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';

export default async function Contact() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-14 space-y-6 sm:space-y-10">

      {/* ── PAGE HEADER ── */}
      <header className="animate-fade-up">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 text-[10px] font-bold uppercase tracking-[.09em]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 14%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--border-default))',
            color: 'color-mix(in srgb, var(--accent) 78%, var(--text-primary))',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: 'var(--accent)' }}
            aria-hidden
          />
          {dict.pages.contact.sectionLabel ?? 'Get in Touch'}
        </div>

        <h1
          className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
          style={{ color: 'var(--text-primary)', letterSpacing: '-.03em' }}
        >
          {dict.pages.contact.title}
        </h1>
        <p
          className="text-sm sm:text-base leading-relaxed max-w-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          {dict.pages.contact.subtitle}
        </p>
      </header>

      {/* ── FAQ SECTION ── */}
      <section
        aria-labelledby="faq-heading"
        className="glass-surface rounded-[20px] p-5 sm:p-7 animate-fade-up stagger-1"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2
            id="faq-heading"
            className="font-display text-lg sm:text-xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {dict.pages.contact.faqTitle}
          </h2>
          <Link
            href={`/${lang}/contact#contact-form`}
            className="text-xs sm:text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            {dict.pages.contact.faqCta}
          </Link>
        </div>

        {/* FaqSection — 'use client' component — DO NOT TOUCH internals */}
        <FaqSection />
      </section>

      {/* ── CONTACT FORM SECTION ── 
          Accent-tinted glass to visually differentiate from FAQ section above */}
      <section
        id="contact-form"
        aria-labelledby="contact-form-heading"
        className="glass-surface rounded-[20px] p-5 sm:p-7 animate-fade-up stagger-2"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 6%, var(--bg-glass)) 0%, var(--bg-glass) 100%)',
          borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border-subtle))',
        }}
      >
        {/* Top accent line — subtle brand signal on form panel */}
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-[20px]"
          style={{
            background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 40%, transparent))',
          }}
          aria-hidden
        />

        <div className="mb-5">
          <h2
            id="contact-form-heading"
            className="font-display text-lg sm:text-xl font-bold tracking-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {dict.pages.contact.formTitle}
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {dict.pages.contact.formSubtitle}
          </p>
        </div>

        {/* ContactForm — 'use client' component — DO NOT TOUCH internals */}
        <ContactForm />
      </section>
    </div>
  );
}