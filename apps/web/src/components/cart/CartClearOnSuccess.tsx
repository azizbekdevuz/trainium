'use client';

import { useEffect } from 'react';
import { emitCartCleared, emitCartChanged } from '../../lib/cart-events';

export default function CartClearOnSuccess() {
  useEffect(() => {
    // Inform navbar components immediately
    emitCartCleared();
    emitCartChanged({ count: 0 });
  }, []);
  return null;
}


