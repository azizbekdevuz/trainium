import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reorderFaqs, reorderFaqCategories } from '@/lib/services/faq';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ids } = body;

    if (!type || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Type and ids array are required' },
        { status: 400 }
      );
    }

    if (type === 'categories') {
      await reorderFaqCategories(ids);
    } else if (type === 'faqs') {
      await reorderFaqs(ids);
    } else {
      return NextResponse.json(
        { error: 'Type must be "categories" or "faqs"' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error reordering FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder FAQs' },
      { status: 500 }
    );
  }
}
