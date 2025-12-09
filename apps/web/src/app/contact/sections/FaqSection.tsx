"use client";

import { useMemo, useState, useEffect } from 'react';
import { useI18n } from '../../../components/providers/I18nProvider';
import { ThinkingEmoji } from '../../../components/ui/media/ThinkingEmoji';
import DOMPurify from 'dompurify';

interface FaqTranslation {
  id: string;
  language: string;
  question: string;
  answer: string;
}

interface Faq {
  id: string;
  categoryId: string;
  order: number;
  active: boolean;
  translations: FaqTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface FaqCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  faqs: Faq[];
  translations: {
    id: string;
    language: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

type FaqItem = { q: string; a: string; category?: string };

export function FaqSection({ items }: { items?: FaqItem[] }) {
  const { dict, lang } = useI18n();
  const allLabel = dict.common?.all || 'All';

  // Fallback FAQ data (same as before for backward compatibility)
  const DEFAULT_FAQ: FaqItem[] = useMemo(() => [
    // Orders
    { q: 'How do I place an order?', a: 'Browse products, add to cart, and proceed to checkout to enter shipping and payment.', category: 'Orders' },
    { q: 'Can I modify or cancel my order?', a: 'If your order has not shipped, contact support with your order number to request changes.', category: 'Orders' },
    { q: 'Where can I see my order history?', a: 'Go to Account > Orders to view order details, status, and receipts.', category: 'Orders' },
    // Shipping
    { q: 'How long does shipping take?', a: 'Most orders ship within 24–48 hours. Delivery usually takes 1–3 business days depending on your location.', category: 'Shipping' },
    { q: 'How can I track my order?', a: 'Use the Track Package link in the header or in your Account > Orders page.', category: 'Shipping' },
    { q: 'Do you ship internationally?', a: 'International shipping is limited. Contact support with your country and postcode for a quote.', category: 'Shipping' },
    // Payments
    { q: 'What payment methods do you accept?', a: 'We accept major cards and local methods via Stripe and Toss (including KakaoPay/Naver Pay where supported).', category: 'Payments' },
    { q: 'Is my payment secure?', a: 'Yes. Payments are processed by PCI-compliant providers (Stripe/Toss). We never store card details.', category: 'Payments' },
    // Returns
    { q: 'What is your return policy?', a: 'Unused products in original packaging can be returned within 14 days. Contact support to start a return.', category: 'Returns' },
    { q: 'How do refunds work?', a: 'After the return is received and inspected, refunds are issued to the original payment method in 3–7 business days.', category: 'Returns' },
    // Products
    { q: 'Are your products covered by warranty?', a: 'Yes. Most items include a limited manufacturer warranty. Check the product page for specifics.', category: 'Products' },
    { q: 'Do you offer bulk or wholesale pricing?', a: 'Yes. See the Special Bargain page or contact us for a custom quote.', category: 'Products' },
    // Account
    { q: 'Do I need an account to order?', a: 'No. Guest checkout is supported. Creating an account lets you track orders and save addresses.', category: 'Account' },
    { q: 'How do I reset my password?', a: 'Use the "Forgot password" link on sign-in. If you need help, contact support.', category: 'Account' },
  ], []);

  const [query, setQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>(allLabel);
  const [dbFaqs, setDbFaqs] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load FAQs from database
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faq?lang=${lang}`);
        if (!response.ok) throw new Error('Failed to load FAQs');
        
        const data = await response.json();
        setDbFaqs(data.categories || []);
      } catch (err) {
        console.error('Error loading FAQs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, [lang]);

  useEffect(() => {
    setActiveCategory(allLabel);
  }, [allLabel]);

  // Convert database FAQs to the format expected by the UI
  const dbFaqItems = useMemo(() => {
    const faqItems: FaqItem[] = [];
    
    dbFaqs.forEach(category => {
      // Get the translated category name or fallback to default name
      const categoryTranslation = category.translations[0];
      const categoryName = categoryTranslation?.name || category.name;
      
      category.faqs.forEach(faq => {
        // Get the first available translation (preferably current language)
        const translation = faq.translations[0];
        if (translation) {
          faqItems.push({
            q: translation.question,
            a: translation.answer,
            category: categoryName,
          });
        }
      });
    });
    
    return faqItems;
  }, [dbFaqs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    
    // Add categories from database FAQs
    dbFaqItems.forEach(item => {
      if (item.category) set.add(item.category);
    });
    
    // Add categories from fallback FAQs if no database FAQs
    if (dbFaqItems.length === 0) {
      (items ?? DEFAULT_FAQ).forEach(item => {
        if (item.category) set.add(item.category);
      });
    }
    
    return [allLabel, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [dbFaqItems, items, DEFAULT_FAQ, allLabel]);

  useEffect(() => {
    setOpenIdx(null);
  }, [activeCategory, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // Use database FAQs if available, otherwise fallback to provided items or default
    const base = dbFaqItems.length > 0 ? dbFaqItems : (items ?? DEFAULT_FAQ);
    const byCategory = activeCategory === allLabel ? base : base.filter(i => (i.category || 'Other') === activeCategory);
    
    if (!q) return byCategory;
    return byCategory.filter(i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q));
  }, [dbFaqItems, items, DEFAULT_FAQ, activeCategory, query, allLabel]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">{dict.faq?.loading || 'Loading FAQs...'}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-sm text-red-500 mb-2">{dict.faq?.error || 'Failed to load FAQs'}</div>
          <div className="text-xs text-gray-500">Falling back to default FAQs</div>
        </div>
        {/* Show fallback FAQs */}
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <div className="inline-flex gap-2 rounded-xl border p-1 bg-gray-50">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-white shadow-sm border text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                    aria-pressed={isActive}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <input
              placeholder={dict.faq?.searchPlaceholder || 'Search FAQs...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border px-3"
              aria-label={dict.faq?.searchPlaceholder || 'Search FAQs...'}
            />
          </div>
          <div className="divide-y">
            {filtered.map((item, idx) => (
              <div key={`${item.q}-${idx}`} className="py-3">
                <button
                  className="w-full text-left flex items-center justify-between"
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  aria-expanded={openIdx === idx}
                >
                  <span className="font-medium">{item.q}</span>
                  <span className="text-gray-400">{openIdx === idx ? '−' : '+'}</span>
                </button>
                {openIdx === idx && (
                  <div 
                    className="mt-2 text-gray-700 text-sm"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.a) }}
                  />
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <div className="mb-4">
                  <ThinkingEmoji size="lg" className="mx-auto" />
                </div>
                <div className="text-sm text-gray-500">
                  {dict.faq?.noResults || 'Nothing to see here yet'}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {dict.faq?.empty || 'FAQs will appear here when available'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 sm:gap-2 rounded-xl border p-1 bg-gray-50">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors ${isActive ? 'bg-white shadow-sm border text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                aria-pressed={isActive}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <input
          placeholder={dict.faq?.searchPlaceholder || 'Search FAQs...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 sm:h-11 w-full rounded-xl border px-3 text-sm sm:text-base"
          aria-label={dict.faq?.searchPlaceholder || 'Search FAQs...'}
        />
      </div>
      <div className="divide-y">
        {filtered.map((item, idx) => (
          <div key={`${item.q}-${idx}`} className="py-3">
            <button
              className="w-full text-left flex items-center justify-between"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              aria-expanded={openIdx === idx}
            >
              <span className="font-medium text-sm sm:text-base">{item.q}</span>
              <span className="text-gray-400 text-lg">{openIdx === idx ? '−' : '+'}</span>
            </button>
            {openIdx === idx && (
              <div 
                className="mt-2 text-gray-700 text-xs sm:text-sm"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.a) }}
              />
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4">
              <ThinkingEmoji size="lg" className="mx-auto" />
            </div>
            <div className="text-sm text-gray-500">
              {dict.faq?.noResults || 'Nothing to see here yet'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {dict.faq?.empty || 'FAQs will appear here when available'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


