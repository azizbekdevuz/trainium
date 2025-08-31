// Utility functions for inventory and stock management

export interface StockStatus {
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockLevel: 'in-stock' | 'low-stock' | 'out-of-stock';
}

/**
 * Determines the stock status based on current stock and low stock threshold
 */
export function getStockStatus(inStock: number, lowStockAt?: number | null): StockStatus {
  const isOutOfStock = inStock === 0;
  const isLowStock = !isOutOfStock && lowStockAt !== null && lowStockAt !== undefined && inStock <= lowStockAt;
  
  let stockLevel: 'in-stock' | 'low-stock' | 'out-of-stock';
  if (isOutOfStock) {
    stockLevel = 'out-of-stock';
  } else if (isLowStock) {
    stockLevel = 'low-stock';
  } else {
    stockLevel = 'in-stock';
  }

  return {
    isLowStock,
    isOutOfStock,
    stockLevel
  };
}

/**
 * Gets the appropriate badge configuration for a product's stock status
 */
export function getStockBadgeConfig(inStock: number, lowStockAt?: number | null) {
  const status = getStockStatus(inStock, lowStockAt);
  
  switch (status.stockLevel) {
    case 'low-stock':
      return {
        show: true,
        text: 'lowStock',
        className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg animate-pulse'
      };
    case 'out-of-stock':
      return {
        show: true,
        text: 'outOfStock',
        className: 'bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg'
      };
    default:
      return {
        show: false,
        text: '',
        className: ''
      };
  }
}
