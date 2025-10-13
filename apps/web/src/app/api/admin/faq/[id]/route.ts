import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  getFaqCategoryById, 
  updateFaqCategory, 
  deleteFaqCategory 
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
    const category = await getFaqCategoryById(id);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });

  } catch (error) {
    console.error('Error fetching FAQ category:', error);
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
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
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
    console.error('Error updating FAQ category:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ category' },
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
    await deleteFaqCategory(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting FAQ category:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ category' },
      { status: 500 }
    );
  }
}
