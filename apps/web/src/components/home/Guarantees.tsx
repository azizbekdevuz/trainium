'use client';

import { useI18n } from '../providers/I18nProvider';

export function Guarantees() {
    const { dict } = useI18n();
    return (
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="glass p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl">{dict.home?.guarantees?.title ?? 'Our guarantees'}</h3>
              <ul className="mt-3 text-gray-700 list-disc pl-5 space-y-1">
                <li>{dict.home?.guarantees?.eta ?? 'Transparent shipping ETA before checkout'}</li>
                <li>{dict.home?.guarantees?.returns ?? '14-day returns (KR domestic)'}</li>
                <li>{dict.home?.guarantees?.warranty ?? 'Warranty & repair network coverage'}</li>
              </ul>
            </div>
            <form method="post" action="/api/newsletter" className="flex gap-3 items-center">
              <input
                name="email"
                required
                type="email"
                placeholder={dict.home?.guarantees?.newsletterPh ?? 'Email for early deals'}
                className="h-11 rounded-xl px-3 border w-full bg-white/70"
              />
              <button className="h-11 rounded-xl px-4 bg-cyan-600 text-white hover-raise">
                {dict.home?.guarantees?.join ?? 'Join'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }  