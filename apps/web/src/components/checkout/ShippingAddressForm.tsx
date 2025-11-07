import { useI18n } from '../providers/I18nProvider';
import type { Address } from './types';

interface ShippingAddressFormProps {
  address: Address;
  setAddress: (updater: (prev: Address) => Address) => void;
  addrErrors: Record<string, string>;
  isAddressValid: boolean;
}

export function ShippingAddressForm({ 
  address, 
  setAddress, 
  addrErrors, 
  isAddressValid 
}: ShippingAddressFormProps) {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5">
      <h2 className="font-semibold mb-3 text-sm sm:text-base">{t('checkout.shipping', 'Shipping details')}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <input 
            className={`border rounded-xl px-3 h-10 w-full ${addrErrors.fullName ? 'border-red-400' : ''}`} 
            placeholder={t('checkout.fullName', 'Full name')}
            value={address.fullName} 
            onChange={e => setAddress(a => ({...a, fullName: e.target.value}))} 
          />
          {addrErrors.fullName && <p className="mt-1 text-xs text-red-600">{addrErrors.fullName}</p>}
        </div>
        <div>
          <input 
            className={`border rounded-xl px-3 h-10 w-full ${addrErrors.phone ? 'border-red-400' : ''}`} 
            placeholder={t('checkout.phone', 'Phone')}
            value={address.phone} 
            onChange={e => setAddress(a => ({...a, phone: e.target.value}))} 
          />
          {addrErrors.phone && <p className="mt-1 text-xs text-red-600">{addrErrors.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <input 
            className={`border rounded-xl px-3 h-10 w-full ${addrErrors.address1 ? 'border-red-400' : ''}`} 
            placeholder={t('checkout.address1', 'Address line 1')}
            value={address.address1} 
            onChange={e => setAddress(a => ({...a, address1: e.target.value}))} 
          />
          {addrErrors.address1 && <p className="mt-1 text-xs text-red-600">{addrErrors.address1}</p>}
        </div>
        <div className="sm:col-span-2">
          <input 
            className="border rounded-xl px-3 h-10 w-full" 
            placeholder={t('checkout.address2', 'Address line 2 (optional)')}
            value={address.address2} 
            onChange={e => setAddress(a => ({...a, address2: e.target.value}))} 
          />
        </div>
        <div>
          <input 
            className={`border rounded-xl px-3 h-10 w-full ${addrErrors.city ? 'border-red-400' : ''}`} 
            placeholder={t('checkout.city', 'City')}
            value={address.city} 
            onChange={e => setAddress(a => ({...a, city: e.target.value}))} 
          />
          {addrErrors.city && <p className="mt-1 text-xs text-red-600">{addrErrors.city}</p>}
        </div>
        <div>
          <input 
            className="border rounded-xl px-3 h-10 w-full" 
            placeholder={t('checkout.state', 'State')}
            value={address.state} 
            onChange={e => setAddress(a => ({...a, state: e.target.value}))} 
          />
        </div>
        <div>
          <input 
            className={`border rounded-xl px-3 h-10 w-full ${addrErrors.postalCode ? 'border-red-400' : ''}`} 
            placeholder={t('checkout.postal', 'Postal code')}
            value={address.postalCode} 
            onChange={e => setAddress(a => ({...a, postalCode: e.target.value}))} 
          />
          {addrErrors.postalCode && <p className="mt-1 text-xs text-red-600">{addrErrors.postalCode}</p>}
        </div>
        <div>
          <input 
            className={`border rounded-xl px-3 h-10 w-full ${addrErrors.country ? 'border-red-400' : ''}`} 
            placeholder={t('checkout.country', 'Country (KR/US/…)')}
            value={address.country} 
            onChange={e => setAddress(a => ({...a, country: e.target.value}))} 
          />
          {addrErrors.country && <p className="mt-1 text-xs text-red-600">{addrErrors.country}</p>}
        </div>
      </div>
      {!isAddressValid && (
        <p className="mt-2 text-xs text-red-600">{t('checkout.completeShipping', 'Please complete required shipping fields.')}</p>
      )}
    </section>
  );
}

