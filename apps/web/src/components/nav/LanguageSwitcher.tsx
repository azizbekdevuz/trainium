'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useTransition } from 'react'

const LOCALE_COOKIE = 'NEXT_LOCALE'
const SUPPORTED = ['en', 'ko', 'uz'] as const
type L = typeof SUPPORTED[number]

function setLocaleCookie(locale: L) {
  const sixMonths = 60 * 60 * 24 * 30 * 6
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${sixMonths}`
}

export default function LanguageSwitcher({ locale }: { locale: L }) {
  const pathname = usePathname()
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = useMemo<L>(() => {
    const seg = pathname.split('/').filter(Boolean)[0]
    if (seg && (SUPPORTED as readonly string[]).includes(seg)) return seg as L
    return locale
  }, [pathname, locale])

  const qs = search.toString()

  function onChange(next: L) {
    if (next === current) return
    setLocaleCookie(next)
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] && (SUPPORTED as readonly string[]).includes(segments[0] as string)) {
      segments[0] = next
    } else {
      segments.unshift(next)
    }
    const nextPath = '/' + segments.join('/') + (qs ? `?${qs}` : '')
    startTransition(() => {
      router.push(nextPath)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <select
        aria-label="Language"
        className="glass-surface h-9 rounded-xl border border-[var(--border-default)] px-3 py-1 text-sm shadow-sm transition hover:brightness-[1.03] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] disabled:opacity-60"
        value={current}
        onChange={(e) => onChange(e.target.value as L)}
        disabled={isPending}
      >
        <option value="en">EN</option>
        <option value="ko">KO</option>
        <option value="uz">UZ</option>
      </select>
    </div>
  )
}


