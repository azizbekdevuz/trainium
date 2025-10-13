import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  getFaqById, 
  updateFaq, 
  deleteFaq 
} from '@/lib/services/faq';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const faq = await getFaqById(id);

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('Error fetching FAQ:', error);
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
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
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
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteFaq(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
