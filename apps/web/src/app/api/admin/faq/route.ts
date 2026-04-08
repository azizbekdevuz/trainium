import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireAdminSession } from '@/auth/require-admin';
import { getAllFaqCategories, createFaqCategory } from '@/lib/services/faq';
import { getRequestLogger } from '@/lib/logging/request-logger';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await getAllFaqCategories();
    return NextResponse.json({ categories });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_categories_get_failed' }, 'Error fetching FAQ categories');
    return NextResponse.json(
      { error: 'Failed to fetch FAQ categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdminSession(session)) {
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
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_category_create_failed' }, 'Error creating FAQ category');
    return NextResponse.json(
      { error: 'Failed to create FAQ category' },
      { status: 500 }
    );
  }
}
