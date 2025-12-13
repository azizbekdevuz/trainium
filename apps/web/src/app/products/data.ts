import { prisma } from '../../lib/database/db';
import { ProductWithRelations } from '../../types/prisma';
import { sortCategories } from '../../lib/product/category-utils';
import type { Dictionary } from '../../lib/i18n/i18n';
import type { ParsedSearchParams } from './types';
import { buildWhereClause, buildOrderBy } from './filters';

const PAGE_SIZE = 12;

export async function getProductsPageData(
  params: ParsedSearchParams,
  dict: Dictionary
) {
  const where = buildWhereClause(params);
  const orderBy = buildOrderBy(params.sort);

  const [rawCategories, pageItems, brands, currencies] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where,
      orderBy,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      take: (params.dir === 'back' ? -1 : 1) * (PAGE_SIZE + 1),
      skip: params.cursor ? 1 : 0,
      include: { categories: true, variants: { take: 1, orderBy: { priceCents: 'asc' } }, inventory: true },
    }) as Promise<ProductWithRelations[]>,
    prisma.product.findMany({
      where: { active: true, brand: { not: null } },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    }),
    prisma.product.findMany({
      where: { active: true },
      distinct: ['currency'],
      select: { currency: true },
      orderBy: { currency: 'asc' },
    }),
  ]);

  const categories = sortCategories(rawCategories, dict);
  const items = params.dir === 'back' ? [...pageItems].reverse() : pageItems;
  const hasMore = items.length > PAGE_SIZE;
  const slice = items.slice(0, PAGE_SIZE);
  const nextCursor = hasMore ? slice[slice.length - 1]?.id : undefined;
  const prevCursor = slice[0]?.id && (params.cursor ? slice[0].id : undefined);
  const currencyOptions = Array.from(new Set(['USD', 'KRW', 'EUR', ...currencies.map((c) => c.currency)])).filter(Boolean);

  return {
    categories,
    products: slice,
    brands,
    currencyOptions,
    nextCursor,
    prevCursor,
  };
}

export async function getProductInteractionData(
  productIds: string[],
  userId?: string
) {
  if (productIds.length === 0) {
    return {
      favCountById: new Map<string, number>(),
      likeCountById: new Map<string, number>(),
      userFavSet: new Set<string>(),
      userLikeSet: new Set<string>(),
    };
  }

  // Build IN clause with proper parameterization
  const productIdsPlaceholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
  const [favCounts, likeCounts] = await Promise.all([
    prisma.$queryRawUnsafe(
      `SELECT "productId", COUNT(*)::int AS count FROM "Favorite" WHERE "productId" IN (${productIdsPlaceholders}) GROUP BY "productId"`,
      ...productIds
    ) as Promise<Array<{ productId: string; count: number }>>,
    prisma.$queryRawUnsafe(
      `SELECT "productId", COUNT(*)::int AS count FROM "ProductLike" WHERE "productId" IN (${productIdsPlaceholders}) GROUP BY "productId"`,
      ...productIds
    ) as Promise<Array<{ productId: string; count: number }>>,
  ]);

  let userFavs: { productId: string }[] = [];
  let userLikes: { productId: string }[] = [];
  if (userId) {
    const userPlaceholders = productIds.map((_, i) => `$${i + 2}`).join(', ');
    [userFavs, userLikes] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT "productId" FROM "Favorite" WHERE "userId" = $1 AND "productId" IN (${userPlaceholders})`,
        userId,
        ...productIds
      ) as Promise<Array<{ productId: string }>>,
      prisma.$queryRawUnsafe(
        `SELECT "productId" FROM "ProductLike" WHERE "userId" = $1 AND "productId" IN (${userPlaceholders})`,
        userId,
        ...productIds
      ) as Promise<Array<{ productId: string }>>,
    ]);
  }

  const favCountById = new Map<string, number>(favCounts.map((r) => [r.productId, r.count]));
  const likeCountById = new Map<string, number>(likeCounts.map((r) => [r.productId, r.count]));
  const userFavSet = new Set(userFavs.map((r) => r.productId));
  const userLikeSet = new Set(userLikes.map((r) => r.productId));

  return {
    favCountById,
    likeCountById,
    userFavSet,
    userLikeSet,
  };
}

