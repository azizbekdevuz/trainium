import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';

export default async function About() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      <header>
        <h1 className="font-display text-3xl">{dict.pages.about.title}</h1>
        <p className="text-gray-600 mt-2">{dict.pages.about.subtitle}</p>
      </header>

      {/* Mission */}
      <section className="grid md:grid-cols-3 gap-4">
        {dict.pages.about.mission.map((c: any) => (
          <div key={c.title} className="rounded-2xl border bg-white dark:bg-slate-900 p-5">
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">{c.desc}</div>
          </div>
        ))}
      </section>

      {/* FAQ excerpt */}
      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-6">
        <h2 className="text-xl font-semibold mb-3">{dict.pages.about.faqExcerpt}</h2>
        <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-2 list-disc list-inside">
          {Array.isArray(dict.pages.about.faqList) && dict.pages.about.faqList.map((q: string, i: number) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
  