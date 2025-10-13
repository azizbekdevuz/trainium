import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createFaq } from '@/lib/services/faq';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, order, translations } = body;

    if (!categoryId || !translations || !Array.isArray(translations)) {
      return NextResponse.json(
        { error: 'Category ID and translations are required' },
        { status: 400 }
      );
    }

    // Validate translations
    for (const translation of translations) {
      if (!translation.language || !translation.question || !translation.answer) {
        return NextResponse.json(
          { error: 'Each translation must have language, question, and answer' },
          { status: 400 }
        );
      }
    }

    const faq = await createFaq({
      categoryId,
      order: order || 0,
      translations,
    });

    return NextResponse.json({ faq }, { status: 201 });

  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
