import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllFaqCategories, createFaqCategory } from '@/lib/services/faq';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await getAllFaqCategories();
    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, name, order, active, translations } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'Slug and name are required' },
        { status: 400 }
      );
    }

    const category = await createFaqCategory({
      slug,
      name,
      order: order || 0,
      active: active !== false,
      translations: translations || [],
    });

    return NextResponse.json({ category }, { status: 201 });

  } catch (error) {
    console.error('Error creating FAQ category:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ category' },
      { status: 500 }
    );
  }
}
