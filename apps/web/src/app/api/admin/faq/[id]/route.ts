import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireAdminSession } from '@/auth/require-admin';
import { 
  getFaqCategoryById, 
  updateFaqCategory, 
  deleteFaqCategory 
} from '@/lib/services/faq';
import { getRequestLogger } from '@/lib/logging/request-logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const category = await getFaqCategoryById(id);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_category_get_failed' }, 'Error fetching FAQ category');
    return NextResponse.json(
      { error: 'Failed to fetch FAQ category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { slug, name, order, active, translations } = body;

    const category = await updateFaqCategory(id, {
      slug,
      name,
      order,
      active,
      translations,
    });

    return NextResponse.json({ category });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_category_update_failed' }, 'Error updating FAQ category');
    return NextResponse.json(
      { error: 'Failed to update FAQ category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteFaqCategory(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_category_delete_failed' }, 'Error deleting FAQ category');
    return NextResponse.json(
      { error: 'Failed to delete FAQ category' },
      { status: 500 }
    );
  }
}
