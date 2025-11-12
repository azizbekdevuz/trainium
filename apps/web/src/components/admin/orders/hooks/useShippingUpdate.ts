import { useState } from 'react';
import type { Dictionary } from '../../../../lib/i18n/i18n';

export function useShippingUpdate(
  orderId: string,
  dict: Dictionary
) {
  const [message, setMessage] = useState<string | null>(null);

  const handleShippingUpdate = async (field: string, value: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update shipping information');
      }

      setMessage(dict.admin?.orders?.detail?.shippingUpdated ?? 'Shipping information updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(dict.admin?.orders?.detail?.shippingUpdateError ?? 'Failed to update shipping information. Please try again.');
    }
  };

  return {
    message,
    setMessage,
    handleShippingUpdate,
  };
}

