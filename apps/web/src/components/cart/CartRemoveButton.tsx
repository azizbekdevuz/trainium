'use client';

import { useTransition } from 'react';
import { removeItemAction } from '../../app/actions/cart';
import { emitCartChanged } from '../../lib/cart/cart-events';
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
      try {
        const res = await fetch('/api/cart/mini', { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          emitCartChanged({ count: j.count });
        } else {
          emitCartChanged({});
        }
      } catch {
        emitCartChanged({});
      }
      showToast(t('cart.removed', 'Item removed from cart'));
    });
  };

  return (
    <button onClick={onRemove} className="text-xs text-red-600" disabled={pending}>
      {pending ? t('cart.removing', 'Removing…') : t('cart.remove', 'Remove')}
    </button>
  );
}


