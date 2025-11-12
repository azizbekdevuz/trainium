import { auth } from "../../auth";
import Link from "next/link";
import { getDictionary, negotiateLocale } from "../../lib/i18n/i18n";

export default async function SpecialBargain() {
  const session = await auth();   
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  if (!session) { 
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl mb-2">{dict.pages.special.title}</h1>
        <p className="text-gray-600 mb-4">{dict.pages.special.signinPrompt}</p>
        <Link href={`/${lang}/auth/signin`} className="rounded-2xl px-5 py-3 bg-cyan-600 text-white">{dict.pages.special.signin}</Link>
      </div>
    );
  }

  const cards = [
    {
      title: dict.pages.special.cards?.wholesale?.title ?? 'Wholesale',
      desc: dict.pages.special.cards?.wholesale?.desc ?? 'Bulk orders with tiered pricing and dedicated support.',
      href: `/${lang}/contact?reason=Offer`,
    },
    {
      title: dict.pages.special.cards?.dealership?.title ?? 'Dealership',
      desc: dict.pages.special.cards?.dealership?.desc ?? 'Partner with us to distribute premium gear in your region.',
      href: `/${lang}/contact?reason=Offer`,
    },
    {
      title: dict.pages.special.cards?.sponsorship?.title ?? 'Sponsorship',
      desc: dict.pages.special.cards?.sponsorship?.desc ?? 'Collaborate on events and athletes with co-branded opportunities.',
      href: `/${lang}/contact?reason=Other`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <h1 className="font-display text-3xl mb-2">{dict.pages.special.title}</h1>
        <p className="text-gray-600 dark:text-slate-400">{dict.pages.special.welcome}, {session.user?.name ?? session.user?.email}.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.title} href={card.href} className="rounded-2xl border bg-white dark:bg-slate-900 p-5 hover:shadow-sm transition">
            <div className="font-medium">{card.title}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">{card.desc}</div>
            <div className="text-cyan-700 text-sm mt-3">{dict.pages.special.contactCta}</div>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-6">
        <h2 className="text-xl font-semibold mb-3">{dict.pages.special.benefits}</h2>
        <ul className="text-sm text-gray-700 dark:text-slate-300 grid md:grid-cols-2 gap-2 list-disc list-inside">
          <li>{dict.pages.special.dedicatedAccountManager}</li>
          <li>{dict.pages.special.priorityFulfillment}</li>
          <li>{dict.pages.special.marketingSupportAndAssets}</li>
          <li>{dict.pages.special.customInvoicingAndPaymentTerms}</li>
        </ul>
      </section>
    </div>
  );
}