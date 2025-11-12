import Link from 'next/link';
import { ContactForm } from './sections/ContactForm';
import { FaqSection } from './sections/FaqSection';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';

export default async function Contact() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl">{dict.pages.contact.title}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-2">{dict.pages.contact.subtitle}</p>
      </header>

      {/* FAQ */}
      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">{dict.pages.contact.faqTitle}</h2>
          <Link href={`/${lang}/contact#contact-form`} className="text-cyan-700 hover:underline text-sm">{dict.pages.contact.faqCta}</Link>
        </div>
        <FaqSection />
      </section>

      {/* Contact form */}
      <section id="contact-form" className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">{dict.pages.contact.formTitle}</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">{dict.pages.contact.formSubtitle}</p>
        </div>
        <ContactForm />
      </section>
    </div>
  );
}