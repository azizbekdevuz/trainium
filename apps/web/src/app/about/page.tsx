import { ArrowRightIcon } from '@/components/ui/media/Icon';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';

export default async function About() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  // Mission card accent colors — one per card, cycling
  const accentColors = [
    { tint: 'rgba(14,165,233,.12)', border: 'rgba(14,165,233,.28)', text: 'var(--accent-hi)' },
    { tint: 'rgba(129,140,248,.12)', border: 'rgba(129,140,248,.28)', text: '#A5B4FC' },
    { tint: 'rgba(16,185,129,.12)',  border: 'rgba(16,185,129,.28)',  text: '#6EE7B7' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-14 space-y-10 sm:space-y-14">

      {/* ── PAGE HEADER ── */}
      <header className="animate-fade-up">
        {/* Section label pill — matches hero bento pill pattern */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 text-[10px] font-bold uppercase tracking-[.09em]"
          style={{
            background: 'var(--hero-bento-pill, color-mix(in srgb, var(--accent) 14%, var(--bg-elevated)))',
            border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--border-default))',
            color: 'color-mix(in srgb, var(--accent) 78%, var(--text-primary))',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: 'var(--accent)' }}
            aria-hidden
          />
          {dict.pages.about.sectionLabel ?? 'About Trainium'}
        </div>

        <h1
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3"
          style={{ color: 'var(--text-primary)', letterSpacing: '-.03em' }}
        >
          {dict.pages.about.title}
        </h1>
        <p
          className="text-sm sm:text-base max-w-xl leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {dict.pages.about.subtitle}
        </p>
      </header>

      {/* ── MISSION CARDS ── */}
      <section aria-labelledby="mission-heading" className="animate-fade-up stagger-2">
        <h2
          id="mission-heading"
          className="font-display text-xs font-bold uppercase tracking-[.10em] mb-5"
          style={{ color: 'var(--text-faint)' }}
        >
          {dict.pages.about.missionLabel ?? 'Our Mission'}
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {dict.pages.about.mission.map((c: { title: string; desc: string }, i: number) => {
            const accent = accentColors[i % accentColors.length];
            return (
              <div
                key={c.title}
                className="glass-surface rounded-[18px] p-5 sm:p-6 card-hover relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${accent.tint} 0%, var(--bg-glass) 100%)`,
                  borderColor: accent.border,
                }}
              >
                {/* Specular top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-[18px]"
                  style={{ background: `linear-gradient(90deg, ${accent.border}, transparent)` }}
                  aria-hidden
                />

                <div
                  className="font-display text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.title}
                </div>
                <div
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {c.desc}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ EXCERPT ── */}
      <section
        aria-labelledby="faq-excerpt-heading"
        className="glass-surface rounded-[20px] p-5 sm:p-7 animate-fade-up stagger-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2
            id="faq-excerpt-heading"
            className="font-display text-lg sm:text-xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {dict.pages.about.faqExcerpt}
          </h2>
          {/* Link to full FAQ on contact page */}
          <a
            href={`/${lang}/contact#contact-form`}
            className="text-xs sm:text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            {dict.pages.about.faqCta ?? 'View full FAQ'} <ArrowRightIcon className="w-4 h-4" />
          </a>
        </div>

        <ul className="space-y-2.5">
          {Array.isArray(dict.pages.about.faqList) &&
            dict.pages.about.faqList.map((q: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm sm:text-[13.5px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {/* Bullet dot — accent colored */}
                <span
                  className="mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--accent)', opacity: 0.7 }}
                  aria-hidden
                />
                {q}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}