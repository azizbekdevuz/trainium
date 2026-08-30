'use client'

import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/i18n-config'
import { replaceLocalePrefix } from '@/lib/i18n/locale-path'

export default function LanguageSwitcher({ locale }: { locale: AppLocale }) {
  function onChange(next: AppLocale) {
    if (next === locale) return
    const url = new URL(window.location.href)
    url.pathname = replaceLocalePrefix(url.pathname, next)
    window.location.assign(url.href)
  }

  return (
    <div className="relative">
      <select
        aria-label="Language"
        className="glass-surface h-9 rounded-xl border border-[var(--border-default)] px-3 py-1 text-sm shadow-sm transition hover:brightness-[1.03] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] disabled:opacity-60"
        value={locale}
        onChange={(e) => onChange(e.target.value as AppLocale)}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  )
}
