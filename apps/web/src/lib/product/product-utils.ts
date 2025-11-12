/**
 * Product utility functions
 */

/**
 * Get the number of minor units (decimal places) for a currency
 * KRW, JPY, VND are zero-decimal currencies
 */
export function currencyMinorUnits(currency: string): number {
  switch (currency.toUpperCase()) {
    case 'KRW':
    case 'JPY':
    case 'VND':
      return 0;
    default:
      return 2;
  }
}

/**
 * Convert price from major units to minor units (cents)
 */
export function priceToMinorUnits(priceMajor: number, currency: string): number {
  return Math.max(0, Math.round(priceMajor * Math.pow(10, currencyMinorUnits(currency))));
}

/**
 * Convert price from minor units (cents) to major units
 */
export function priceToMajorUnits(priceCents: number, currency: string): number {
  return priceCents / Math.pow(10, currencyMinorUnits(currency));
}

