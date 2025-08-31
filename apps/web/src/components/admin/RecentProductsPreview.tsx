'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import { Icon } from '../ui/Icon';

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-white">
            <Icon name="shopping" className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {dict.admin?.dashboard?.recent?.products || 'Recent Products'}
          </h3>
        </div>
        <Link
          href={`/${lang}/admin/products`}
          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors group-hover:translate-x-1 transform duration-200"
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
                  bg-slate-50 dark:bg-slate-800 
                  hover:bg-slate-100 dark:hover:bg-slate-700 
                  transition-all duration-200 group/item
                  border border-transparent hover:border-slate-200 dark:hover:border-slate-600
                  hover:shadow-md hover:scale-[1.02] transform
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 group-hover/item:scale-110 transition-transform duration-200">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <Icon name="image" className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {product.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    /{product.slug}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(product.priceCents, product.currency)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Icon name="shopping" className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {dict.admin?.dashboard?.noData || 'No products found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
