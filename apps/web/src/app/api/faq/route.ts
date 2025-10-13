import { NextRequest, NextResponse } from 'next/server';
import { getFaqsByLanguage } from '@/lib/services/faq';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    // Validate language
    const supportedLanguages = ['en', 'ko', 'uz'];
    if (!supportedLanguages.includes(language)) {
      return NextResponse.json(
        { error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const categories = await getFaqsByLanguage(language);
    
    // Filter out categories with no FAQs or no translations
    const filteredCategories = categories.filter(category => 
      category.faqs.length > 0 && 
      category.faqs.some(faq => faq.translations.length > 0)
    );

    return NextResponse.json({ categories: filteredCategories });

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
