import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/database/db";
import { addCategoryTranslation } from "../../../../lib/product/category-translations";
import { validateCategoryRequest } from "../../../../lib/utils/validation";
import { ERROR_MESSAGES } from "../../../../types/api";
import type { CreateCategoryRequest, CreateCategoryResponse, GetCategoriesResponse, ApiErrorResponse } from "../../../../types/api";

export const runtime = "nodejs";

/**
 * GET - Fetch all categories
 * Returns all categories ordered by name
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest): Promise<NextResponse<GetCategoriesResponse | ApiErrorResponse>> {
  try {
    const session = await auth();
    
    // Enhanced authorization check with proper typing
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED }, 
        { status: 401 }
      );
    }

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.DATABASE_ERROR }, 
      { status: 500 }
    );
  }
}

/**
 * POST - Create new category
 * Supports both legacy format (name, slug, order) and new format (with translations)
 * Uses database transactions for atomic operations
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateCategoryResponse | ApiErrorResponse>> {
  try {
    const session = await auth();
    
    // Enhanced authorization check with proper typing
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED }, 
        { status: 401 }
      );
    }

    const requestData: CreateCategoryRequest = await request.json();
    
    // Comprehensive validation
    const validation = validateCategoryRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: ERROR_MESSAGES.INVALID_REQUEST,
          details: validation.errors.join(', ')
        }, 
        { status: 400 }
      );
    }

    const { name, slug, order = 0, active = true, translations } = requestData;

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: slug.trim() },
      select: { id: true }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SLUG_ALREADY_EXISTS }, 
        { status: 400 }
      );
    }

    // Use database transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create category in database
      const category = await tx.category.create({
        data: {
          name: name.trim(),
          slug: slug.trim(),
          order,
          active
        }
      });

      // Prepare translation data
      const translationData = translations || {
        en: name.trim(),
        ko: name.trim(),
        uz: name.trim()
      };

      // Add translations to locale files
      const translationSuccess = await addCategoryTranslation({
        name: name.trim(),
        slug: slug.trim(),
        order,
        active,
        translations: translationData
      });

      if (!translationSuccess) {
        console.warn('Category created but translations failed to update');
        // Note: We don't rollback the transaction here as the category creation is more critical
        // The translation can be fixed later via admin interface
      }

      return category;
    });

    return NextResponse.json({ category: result });
  } catch (error) {
    console.error('Failed to create category:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.SLUG_ALREADY_EXISTS }, 
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR }, 
      { status: 500 }
    );
  }
}
