export interface FaqTranslation {
  id?: string;
  language: string;
  question: string;
  answer: string;
}

export interface Faq {
  id: string;
  categoryId: string;
  order: number;
  active: boolean;
  translations: FaqTranslation[];
  createdAt: string;
  updatedAt: string;
}

export interface FaqCategoryTranslation {
  id: string;
  language: string;
  name: string;
}

export interface FaqCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  faqs: Faq[];
  translations: FaqCategoryTranslation[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  order: number;
  active: boolean;
  translations: {
    language: string;
    name: string;
  }[];
}

export interface FaqFormData {
  categoryId: string;
  order: number;
  active: boolean;
  translations: {
    language: string;
    question: string;
    answer: string;
  }[];
}

