export interface FaqWithTranslations {
  id: string;
  categoryId: string;
  order: number;
  active: boolean;
  translations: {
    id: string;
    language: string;
    question: string;
    answer: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqCategoryWithFaqs {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  faqs: FaqWithTranslations[];
  translations: {
    id: string;
    language: string;
    name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFaqData {
  categoryId: string;
  order?: number;
  translations: {
    language: string;
    question: string;
    answer: string;
  }[];
}

export interface UpdateFaqData {
  categoryId?: string;
  order?: number;
  active?: boolean;
  translations?: {
    language: string;
    question: string;
    answer: string;
  }[];
}

export interface CreateFaqCategoryData {
  slug: string;
  name: string;
  order?: number;
  active?: boolean;
  translations?: {
    language: string;
    name: string;
  }[];
}

export interface UpdateFaqCategoryData {
  slug?: string;
  name?: string;
  order?: number;
  active?: boolean;
  translations?: {
    language: string;
    name: string;
  }[];
}

