// Optimized i18n system with caching and lazy loading
import 'server-only'
import { cookies, headers } from 'next/headers'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, type AppLocale } from './i18n-config'

// LRU Cache for locale dictionaries
class LocaleCache {
  private cache = new Map<string, any>();
  private maxSize = 50;
  private ttl = 1000 * 60 * 60; // 1 hour
  private timestamps = new Map<string, number>();

  get(key: string): any | null {
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.delete(firstKey);
      }
    }
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

const localeCache = new LocaleCache();

export async function negotiateLocale(): Promise<AppLocale> {
  // 1) Cookie
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value as AppLocale | undefined
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie)) return fromCookie

  // 2) Middleware-provided header
  const hdrs = await headers()
  const fromHeader = (hdrs.get('x-locale') as AppLocale | null) || null
  if (fromHeader && SUPPORTED_LOCALES.includes(fromHeader)) return fromHeader

  // 3) Accept-Language
  const accept = hdrs.get('accept-language') || ''
  const preferred = accept.split(',').map((v: string) => v.trim().split(';')[0])
  for (const p of preferred) {
    const base = p.split('-')[0] as AppLocale
    if (SUPPORTED_LOCALES.includes(base)) return base
  }

  // 4) Default
  return DEFAULT_LOCALE
}

export type Dictionary = Record<string, any>

// Optimized dictionary import with caching
async function importDict(locale: AppLocale): Promise<Dictionary> {
  const cacheKey = `${locale}-full`;
  
  // Check cache first
  const cached = localeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let dict: Dictionary;
  
  try {
    // Load full dictionary (route-based loading can be implemented later)
    switch (locale) {
      case 'ko':
        dict = (await import('../locales/ko.json')).default;
        break;
      case 'uz':
        dict = (await import('../locales/uz.json')).default;
        break;
      case 'en':
      default:
        dict = (await import('../locales/en.json')).default;
    }
    
    // Cache the result
    localeCache.set(cacheKey, dict);
    return dict;
  } catch {
    console.warn(`Failed to load ${locale} dictionary, falling back to full dictionary`);
    // Fallback to full dictionary
    return importDict(locale);
  }
}

export async function getDictionary(locale?: AppLocale): Promise<Dictionary> {
  const loc = locale ?? await negotiateLocale()
  const dict = await importDict(loc)
  
  if (loc === 'en') return dict
  
  // Fallback to en for missing keys
  const base = await importDict('en')
  return deepMerge(base, dict)
}

// Optimized deep merge function
function deepMerge(base: any, override: any): any {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base
  if (typeof base !== 'object' || typeof override !== 'object') return override ?? base
  if (base === null || override === null) return override ?? base

  const result = { ...base }
  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
        result[key] = deepMerge(base[key], override[key])
      } else {
        result[key] = override[key]
      }
    }
  }
  return result
}

// Preload common translations for better performance
export async function preloadCommonTranslations(): Promise<void> {
  const promises = SUPPORTED_LOCALES.map(locale => 
    importDict(locale).catch(() => {
      console.warn(`Failed to preload ${locale} translations`);
    })
  );
  
  await Promise.all(promises);
}

// Clear cache (useful for development)
export function clearLocaleCache(): void {
  localeCache.clear();
}

// Get cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: (localeCache as any).cache.size,
    keys: Array.from((localeCache as any).cache.keys())
  };
}
