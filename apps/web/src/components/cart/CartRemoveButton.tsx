'use client';

import { useTransition } from 'react';
import { removeItemAction } from '../../app/actions/cart';
import { refreshCartCountFromServer } from '../../lib/cart/cart-events';
import { showToast } from '../../lib/ui/toast';
import { useI18n } from '../providers/I18nProvider';

export default function CartRemoveButton({ itemId }: { itemId: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const onRemove = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('itemId', itemId);
      await removeItemAction(formData);
      await refreshCartCountFromServer();
      showToast(t('cart.removed', 'Item removed from cart'));
    });
  };

  return (
    <button onClick={onRemove} className="text-xs text-red-600" disabled={pending}>
      {pending ? t('cart.removing', 'Removing…') : t('cart.remove', 'Remove')}
    </button>
  );
}


