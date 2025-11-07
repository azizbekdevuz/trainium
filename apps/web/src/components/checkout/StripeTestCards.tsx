import { useI18n } from '../providers/I18nProvider';
import { useTheme } from '../providers/ThemeProvider';

interface StripeTestCardsProps {
  showTestCards: boolean;
  onToggle: () => void;
}

export function StripeTestCards({ showTestCards, onToggle }: StripeTestCardsProps) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${
      theme === 'dark' 
        ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium mb-1">{t('checkout.stripeTestMode', 'TEST MODE: Use test cards below. No real charges.')}</div>
          <button
            onClick={onToggle}
            className={`text-xs underline hover:no-underline mt-1 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
            }`}
          >
            {showTestCards 
              ? '▼ ' + (lang === 'ko' ? '숨기기' : lang === 'uz' ? 'Yashirish' : 'Hide')
              : '▶ ' + t('checkout.stripeTestCardInfo', 'Show test card information')
            }
          </button>
        </div>
      </div>
      
      {/* Test Cards Collapsible Section */}
      {showTestCards && (
        <div className={`mt-4 pt-4 border-t space-y-3 ${
          theme === 'dark' ? 'border-yellow-700/30' : 'border-yellow-200'
        }`}>
          <div className="text-xs font-medium mb-2">
            {t('checkout.stripeTestCards', 'Test Cards')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Success Card */}
            <div className={`p-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-green-900/20 border-green-700/50' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-green-300' : 'text-green-700'
              }`}>
                ✓ {t('checkout.stripeTestCardSuccess', 'Success')}
              </div>
              <div className={`font-mono text-xs ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                {t('checkout.stripeTestCardSuccessDesc', '4242 4242 4242 4242 - Any future expiry, any CVC')}
              </div>
            </div>
            
            {/* Decline Card */}
            <div className={`p-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-red-900/20 border-red-700/50' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-red-300' : 'text-red-700'
              }`}>
                ✗ {t('checkout.stripeTestCardDecline', 'Decline')}
              </div>
              <div className={`font-mono text-xs ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {t('checkout.stripeTestCardDeclineDesc', '4000 0000 0000 0002 - Card declined')}
              </div>
            </div>
            
            {/* Insufficient Funds Card */}
            <div className={`p-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-orange-900/20 border-orange-700/50' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-orange-300' : 'text-orange-700'
              }`}>
                ⚠ {t('checkout.stripeTestCardInsufficient', 'Insufficient Funds')}
              </div>
              <div className={`font-mono text-xs ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>
                {t('checkout.stripeTestCardInsufficientDesc', '4000 0000 0000 9995 - Insufficient funds')}
              </div>
            </div>
            
            {/* 3D Secure Card */}
            <div className={`p-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-blue-900/20 border-blue-700/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
              }`}>
                🔒 {t('checkout.stripeTestCard3DS', '3D Secure')}
              </div>
              <div className={`font-mono text-xs ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {t('checkout.stripeTestCard3DSDesc', '4000 0025 0000 3155 - Requires authentication')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

