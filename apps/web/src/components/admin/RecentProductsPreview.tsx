'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { Icon } from '../ui/media/Icon';

interface Product {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  active: boolean;
  images: any;
}

interface RecentProductsPreviewProps {
  products: Product[];
  dict: any;
  lang: string;
}

export function RecentProductsPreview({ products, dict, lang }: RecentProductsPreviewProps) {
  const getProductImage = (images: any) => {
    if (Array.isArray(images) && images.length > 0) {
      return images[0]?.src || null;
    }
    return null;
  };

  return (
    <div className="glass-surface rounded-2xl shadow-sm border border-ui-default dark:border-ui-subtle p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-lo))] flex items-center justify-center text-[var(--on-accent-ink)]">
            <Icon name="shopping" className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-ui-primary">
            {dict.admin?.dashboard?.recent?.products || 'Recent Products'}
          </h3>
        </div>
        <Link
          href={`/${lang}/admin/products`}
          className="text-sm text-accent hover:opacity-80 font-medium transition-colors group-hover:translate-x-1 transform duration-200"
        >
          {dict.admin?.dashboard?.viewAll || 'View All'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((product, index) => {
            const imageSrc = getProductImage(product.images);
            
            return (
              <div
                key={product.id}
                className={`
                  flex items-center space-x-4 p-4 rounded-xl 
                  glass-surface
                  border border-ui-default dark:border-ui-subtle
                  hover:shadow-md hover:scale-[1.01] 
                  transition-all duration-200 group/item
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ui-inset transition-transform duration-200 group-hover/item:scale-110">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ui-faint dark:text-ui-faint">
                      <Icon name="image" className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-ui-primary truncate">
                      {product.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-ui-inset text-ui-primary dark:bg-[color-mix(in_srgb,var(--bg-inset)_30%,transparent)] dark:text-ui-faint'
                    }`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-ui-muted dark:text-ui-faint truncate">
                    /{product.slug}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-ui-primary">
                    {formatCurrency(product.priceCents, product.currency)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ui-inset dark:bg-ui-elevated flex items-center justify-center">
              <Icon name="shopping" className="w-8 h-8 text-ui-faint dark:text-ui-faint" />
            </div>
            <p className="text-ui-faint dark:text-ui-faint">
              {dict.admin?.dashboard?.noData || 'No products found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
