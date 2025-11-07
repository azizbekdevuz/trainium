import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useI18n } from '../../../components/providers/I18nProvider';
import type { Address } from '../types';

export function useAddressValidation(initialAddress: Address) {
  const { t } = useI18n();
  const [address, setAddress] = useState<Address>(initialAddress);
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});
  
  const AddressSchema = useMemo(() => z.object({
    fullName: z.string().min(2, t('checkout.fullNameReq', 'Full name is required')),
    phone: z.string().min(6, t('checkout.phoneReq', 'Phone is required')),
    address1: z.string().min(3, t('checkout.address1Req', 'Address is required')),
    address2: z.string().optional(),
    city: z.string().min(2, t('checkout.cityReq', 'City is required')),
    state: z.string().optional(),
    postalCode: z.string().min(3, t('checkout.postalReq', 'Postal code is required')),
    country: z.string().min(2, t('checkout.countryReq', 'Country is required')),
  }), [t]);
  
  const isAddressValid = useMemo(() => {
    const parsed = AddressSchema.safeParse(address);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (v && v[0]) e[k] = v[0] as string;
      }
      setAddrErrors(e);
      return false;
    }
    setAddrErrors({});
    return true;
  }, [AddressSchema, address]);
  
  return { address, setAddress, addrErrors, isAddressValid };
}

