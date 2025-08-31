'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';

export default function ToastOnQuery() {
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const msg = search.get('toast');
    if (!msg) return;
    showToast(decodeURIComponent(msg));
    const url = new URL(window.location.href);
    url.searchParams.delete('toast');
    router.replace(url.pathname + (url.search ? url.search : ''));
  }, [search, router]);

  return null;
}


