function currencyMinorUnits(currency: string): number {
    switch (currency.toUpperCase()) {
        case 'KRW':
        case 'JPY':
        case 'VND':
            return 0;
        default:
            return 2;
    }
}

export function formatCurrency(amountMinor: number, currency = 'KRW', locale = 'en-US') {
    const divisor = Math.pow(10, currencyMinorUnits(currency));
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amountMinor / divisor);
}

export const cn = (...classes: (string | false | null | undefined)[]) =>
    classes.filter(Boolean).join(' ');