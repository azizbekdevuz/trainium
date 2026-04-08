import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireAdminSession } from '@/auth/require-admin';
import { 
  getFaqById, 
  updateFaq, 
  deleteFaq 
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
    const faq = await getFaqById(id);

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_item_get_failed' }, 'Error fetching FAQ');
    return NextResponse.json(
      { error: 'Failed to fetch FAQ' },
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
    const { categoryId, order, active, translations } = body;

    // Validate translations if provided
    if (translations && Array.isArray(translations)) {
      for (const translation of translations) {
        if (!translation.language || !translation.question || !translation.answer) {
          return NextResponse.json(
            { error: 'Each translation must have language, question, and answer' },
            { status: 400 }
          );
        }
      }
    }

    const faq = await updateFaq(id, {
      categoryId,
      order,
      active,
      translations,
    });

    return NextResponse.json({ faq });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_item_update_failed' }, 'Error updating FAQ');
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
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
    await deleteFaq(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_faq_item_delete_failed' }, 'Error deleting FAQ');
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
