import type { StripeElementLocale } from "@stripe/stripe-js";

/**
 * Map our app locales to Stripe supported locales
 */
export function getStripeLocale(appLang: string): StripeElementLocale {
  const supported: StripeElementLocale[] = [
    'auto','en','en-GB', 'ko'
  ];
  const asExact = supported.find(l => l === (appLang as StripeElementLocale));
  if (asExact) return asExact;
  if (appLang === 'uz') return 'en';
  if (appLang.startsWith('pt')) return 'pt-BR';
  if (appLang.startsWith('zh')) return 'zh';
  return 'en';
}

