import { auth } from '../../auth';
import Link from 'next/link';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';
import { Icon } from '@/components/ui/media/Icon';

export default async function SpecialBargain() {
  const session = await auth();
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 14%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--border-default))',
            color: 'color-mix(in srgb, var(--accent) 78%, var(--text-primary))',
          }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
          {dict.pages.special.title}
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ui-primary sm:text-3xl">
          {dict.pages.special.title}
        </h1>
        <p className="mt-2 text-sm text-ui-muted sm:text-base">{dict.pages.special.signinPrompt}</p>
        <Link href={`/${lang}/auth/signin`} className="btn-primary mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold">
          {dict.pages.special.signin}
        </Link>
      </div>
    );
  }

  const cards = [
    {
      title: dict.pages.special.cards?.wholesale?.title ?? 'Wholesale',
      desc: dict.pages.special.cards?.wholesale?.desc ?? 'Bulk orders with tiered pricing and dedicated support.',
      href: `/${lang}/contact?reason=Offer`,
      accent: { tint: 'rgba(14,165,233,.14)', border: 'rgba(14,165,233,.3)', line: 'rgba(14,165,233,.45)' },
    },
    {
      title: dict.pages.special.cards?.dealership?.title ?? 'Dealership',
      desc: dict.pages.special.cards?.dealership?.desc ?? 'Partner with us to distribute premium gear in your region.',
      href: `/${lang}/contact?reason=Offer`,
      accent: { tint: 'rgba(129,140,248,.12)', border: 'rgba(129,140,248,.28)', line: 'rgba(129,140,248,.45)' },
    },
    {
      title: dict.pages.special.cards?.sponsorship?.title ?? 'Sponsorship',
      desc: dict.pages.special.cards?.sponsorship?.desc ?? 'Collaborate on events and athletes with co-branded opportunities.',
      href: `/${lang}/contact?reason=Other`,
      accent: { tint: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.28)', line: 'rgba(16,185,129,.45)' },
    },
  ];

  const benefits = [
    dict.pages.special.dedicatedAccountManager,
    dict.pages.special.priorityFulfillment,
    dict.pages.special.marketingSupportAndAssets,
    dict.pages.special.customInvoicingAndPaymentTerms,
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:space-y-14 sm:px-6 sm:py-14">
      <header className="animate-fade-up">
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em]"
          style={{
            background: 'var(--hero-bento-pill, color-mix(in srgb, var(--accent) 14%, var(--bg-elevated)))',
            border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--border-default))',
            color: 'color-mix(in srgb, var(--accent) 78%, var(--text-primary))',
          }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
          {dict.pages.special.title}
        </div>
        <h1
          className="font-display text-3xl font-extrabold tracking-tight text-ui-primary sm:text-4xl lg:text-5xl"
          style={{ letterSpacing: '-.03em' }}
        >
          {dict.pages.special.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ui-muted sm:text-base">
          {dict.pages.special.welcome}, {session.user?.name ?? session.user?.email}.
        </p>
      </header>

      <section aria-label="Programs" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
        <Link
          href={cards[0].href}
          className="group relative overflow-hidden rounded-[20px] border glass-surface p-6 transition hover:shadow-lg hover:shadow-cyan-500/10 sm:col-span-2 sm:p-7 lg:col-span-7 lg:min-h-[220px]"
          style={{
            background: `linear-gradient(155deg, ${cards[0].accent.tint} 0%, var(--bg-glass) 100%)`,
            borderColor: cards[0].accent.border,
          }}
        >
          <div
            className="absolute left-0 right-0 top-0 h-[1.5px] rounded-t-[20px]"
            style={{ background: `linear-gradient(90deg, ${cards[0].accent.line}, transparent)` }}
            aria-hidden
          />
          <h2 className="font-display text-xl font-bold text-ui-primary sm:text-2xl">{cards[0].title}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ui-secondary sm:text-base">{cards[0].desc}</p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            {dict.pages.special.contactCta}
            <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-5 lg:grid-rows-2 lg:gap-4">
          {cards.slice(1).map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col overflow-hidden rounded-[18px] border glass-surface p-5 transition hover:shadow-md sm:p-6"
              style={{
                background: `linear-gradient(145deg, ${card.accent.tint} 0%, var(--bg-glass) 100%)`,
                borderColor: card.accent.border,
              }}
            >
              <div
                className="absolute left-0 right-0 top-0 h-[1.5px] rounded-t-[18px]"
                style={{ background: `linear-gradient(90deg, ${card.accent.line}, transparent)` }}
                aria-hidden
              />
              <h2 className="font-display text-lg font-bold text-ui-primary">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ui-secondary">{card.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                {dict.pages.special.contactCta}
                <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-[20px] border glass-surface p-6 sm:p-8"
        style={{
          borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border-default))',
        }}
      >
        <div
          className="absolute left-0 right-0 top-0 h-[1.5px]"
          style={{
            background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 50%, transparent), transparent)',
          }}
          aria-hidden
        />
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-ui-faint">
          {dict.pages.special.benefits}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {benefits.map((line) => (
            <li
              key={line}
              className="flex gap-3 rounded-xl border border-ui-subtle/60 bg-ui-inset/50 px-4 py-3 text-sm text-ui-secondary dark:bg-ui-elevated/20"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                aria-hidden
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
