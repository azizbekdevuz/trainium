import { SUPPORTED_LOCALES, type AppLocale } from './i18n-config'

function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function replaceLocalePrefix(pathname: string, nextLocale: AppLocale): string {
  const segments = pathname.split('/')
  const firstIdx = segments[0] === '' ? 1 : 0
  const first = segments[firstIdx]

  if (first && isSupportedLocale(first)) {
    segments[firstIdx] = nextLocale
  } else if (!first) {
    return `/${nextLocale}`
  } else {
    segments.splice(firstIdx, 0, nextLocale)
  }

  const result = segments.join('/')
  return result.startsWith('/') ? result : `/${result}`
}
