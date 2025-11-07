import { useI18n } from '../providers/I18nProvider';
import { useTheme } from '../providers/ThemeProvider';

export function StripeUzbekHelper() {
  const { t, lang } = useI18n();
  const { theme } = useTheme();

  if (lang !== 'uz') return null;

  return (
    <div className={`text-sm space-y-1 p-3 rounded-lg ${
      theme === 'dark' 
        ? 'bg-slate-800 text-slate-300' 
        : 'bg-gray-50 text-gray-700'
    }`} id="stripe-uz-labels">
      <div className="font-medium">{t('checkout.cardHelpTitle', "Kartangiz ma'lumotlarini kiriting")}</div>
      <div>• {t('checkout.cardHelpCardNumber', "Karta raqami")}</div>
      <div>• {t('checkout.cardHelpExpiry', "Amal qilish muddati")}</div>
      <div>• {t('checkout.cardHelpCvc', "CVC (xavfsizlik kodi)")}</div>
      <div>• {t('checkout.cardHelpCountry', "Mamlakat")}</div>
    </div>
  );
}

