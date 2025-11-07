export type SearchParams = {
  q?: string;
  category?: string;
  inStock?: string;
  min?: string;
  max?: string;
  sort?: 'new' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
  cursor?: string;
  dir?: 'forward' | 'back';
  brand?: string;
  currency?: string;
  withVar?: string;
};

export type ParsedSearchParams = {
  q: string;
  category: string;
  min: number;
  max: number;
  sort: NonNullable<SearchParams['sort']>;
  inStock: boolean;
  cursor: string;
  dir: 'forward' | 'back';
  brand: string;
  currency: string;
  withVar: boolean;
  categoriesSelected: string[];
  brandsSelected: string[];
};

