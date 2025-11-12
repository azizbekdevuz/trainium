'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../../lib/utils/format';
import { useResponsive } from '../../hooks/useResponsive';
import { ProductImage } from './ProductImage';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  variants: number;
  stock: number;
  active: boolean;
  images?: any;
};

type Dict = any;

export default function ProductsTable({ items, dict, lang }: { items: ProductRow[]; dict: Dict; lang: string }) {
  const { isMobile } = useResponsive();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);

  useEffect(() => {
    const allChecked = items.length > 0 && selectedIds.length === items.length;
    const someChecked = selectedIds.length > 0 && selectedIds.length < items.length;
    setSelectAll(allChecked);
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked;
  }, [items.length, selectedIds]);

  const onToggleAll = (checked: boolean) => {
    setSelectAll(checked);
    const next: Record<string, boolean> = {};
    for (const it of items) next[it.id] = checked;
    setSelected(next);
  };

  const onToggle = (id: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [id]: checked }));
  };

  const onDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm((dict?.admin?.products?.confirmDelete ?? 'Are you sure you want to delete {{0}} products? This action cannot be undone.').replace('{{0}}', String(selectedIds.length)));
    if (!confirmed) return;
    try {
      setDeleting(true);
      const res = await fetch('/api/admin/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed');
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: (dict?.admin?.products?.deleteSuccess ?? 'Deleted {{0}} products.').replace('{{0}}', String(j.count ?? selectedIds.length)), id: Date.now() } }));
      window.location.reload();
    } catch {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: (dict?.admin?.products?.deleteFailed ?? 'Failed to delete products.'), id: Date.now() } }));
    } finally {
      setDeleting(false);
    }
  };

  if (isMobile) {
    return (
      <div className="mt-6 space-y-4">
        {items.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selected[p.id] || false}
                  onChange={(e) => onToggle(p.id, e.currentTarget.checked)}
                  className="rounded"
                />
                <ProductImage images={p.images} name={p.name} className="w-12 h-12" />
              </div>
              <Link href={`/${lang}/admin/products/${p.id}/edit`} className="text-cyan-600 hover:underline text-sm">
                {dict?.admin?.products?.edit ?? 'Edit'}
              </Link>
            </div>
            
            <div>
              <h3 className="font-medium text-sm">{p.name}</h3>
              <p className="text-xs text-gray-500">{p.slug}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">{dict?.admin?.products?.priceLabel || 'Price'}:</span>
                <span className="ml-1 font-medium">{formatCurrency(p.priceCents, p.currency)}</span>
              </div>
              <div>
                <span className="text-gray-500">{dict?.admin?.products?.stockLabel || 'Stock'}:</span>
                <span className="ml-1 font-medium">{p.stock}</span>
              </div>
              <div>
                <span className="text-gray-500">{dict?.admin?.products?.variantsLabel || 'Variants'}:</span>
                <span className="ml-1 font-medium">{p.variants}</span>
              </div>
              <div>
                <span className="text-gray-500">{dict?.admin?.products?.statusLabel || 'Status'}:</span>
                <span className={`ml-1 font-medium ${p.active ? 'text-green-600' : 'text-red-600'}`}>
                  {p.active ? (dict?.admin?.products?.active || 'Active') : (dict?.admin?.products?.inactive || 'Inactive')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-4 py-2">
              <input
                ref={selectAllRef}
                id="select-all"
                type="checkbox"
                checked={selectAll}
                onChange={(e) => onToggleAll(e.currentTarget.checked)}
              />
            </th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">{dict?.admin?.products?.thImage ?? 'Image'}</th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">{dict?.admin?.products?.thName ?? 'Name'}</th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hidden sm:table-cell">{dict?.admin?.products?.thSlug ?? 'Slug'}</th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">{dict?.admin?.products?.thPrice ?? 'Price'}</th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hidden md:table-cell">{dict?.admin?.products?.thVariants ?? 'Variants'}</th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">{dict?.admin?.products?.thStock ?? 'Stock'}</th>
            <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">{dict?.admin?.products?.thStatus ?? 'Status'}</th>
            <th className="px-3 sm:px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id} className="border-t">
              <td className="px-3 sm:px-4 py-2">
                <input
                  type="checkbox"
                  checked={!!selected[p.id]}
                  onChange={(e) => onToggle(p.id, e.currentTarget.checked)}
                />
              </td>
              <td className="px-3 sm:px-4 py-2">
                <ProductImage images={p.images} name={p.name} />
              </td>
              <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{p.name}</td>
              <td className="px-3 sm:px-4 py-2 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">{p.slug}</td>
              <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{formatCurrency(p.priceCents, p.currency)}</td>
              <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm hidden md:table-cell">{p.variants}</td>
              <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{p.stock}</td>
              <td className="px-3 sm:px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.active ? (dict?.admin?.products?.active || 'Active') : (dict?.admin?.products?.inactive || 'Inactive')}</span>
              </td>
              <td className="px-3 sm:px-4 py-2 text-right">
                <Link href={`/${lang}/admin/products/${p.id}/edit`} className="text-cyan-700 hover:underline text-xs sm:text-sm">{dict?.admin?.products?.edit ?? 'Edit'}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 sm:p-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        <button
          type="button"
          className="rounded-lg bg-red-600 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-red-700 disabled:opacity-60"
          onClick={onDelete}
          disabled={deleting || selectedIds.length === 0}
        >
          {dict?.admin?.products?.deleteSelected ?? 'Delete selected'}
        </button>
      </div>
    </div>
  );
}


