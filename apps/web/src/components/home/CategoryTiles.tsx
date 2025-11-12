import Link from 'next/link';
import { prisma } from '../../lib/database/db';
import Tilt from '../ui/animations/Tilt';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';
import { getCategoryDisplayName } from '../../lib/product/category-utils';
import { Dumbbell, Bike, Activity, HeartPulse, Boxes, Flame } from 'lucide-react';

function getIconForCategory(slug: string | null | undefined) {
  const s = slug?.toLowerCase() || '';
  if (s.includes('dumb') || s.includes('strength') || s.includes('barbell')) return Dumbbell;
  if (s.includes('bike') || s.includes('cycle')) return Bike;
  if (s.includes('cardio') || s.includes('tread') || s.includes('row')) return Activity;
  if (s.includes('heart') || s.includes('fitness')) return HeartPulse;
  if (s.includes('kettle') || s.includes('plates') || s.includes('racks')) return Boxes;
  if (s.includes('hot') || s.includes('deal') || s.includes('elite')) return Flame;
  return Boxes;
}

export async function CategoryTiles() {
  const [lang, categories] = await Promise.all([
    negotiateLocale(),
    prisma.category.findMany({ orderBy: { name: 'asc' }, take: 6 })
  ]);
  const dict = await getDictionary(lang);
  if (!categories.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <h2 className="font-display text-xl sm:text-2xl mb-4">{dict.home.categoryTiles.title}</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <Tilt key={c.id} className="rounded-2xl">
            <Link
              href={`/products?q=&category=${c.slug}&inStock=1&min=0&max=50000000&sort=new`}
              className="rounded-2xl border bg-white p-3 sm:p-4 text-center block"
            >
              <div className="aspect-square rounded-xl bg-[rgba(var(--color-muted))] mb-2 sm:mb-3 flex items-center justify-center">
                {(() => {
                  const Icon = getIconForCategory(c.slug);
                  return (
                    <Icon aria-hidden className="h-7 w-7 sm:h-8 sm:w-8 text-gray-700" />
                  );
                })()}
              </div>
              <div className="font-medium text-sm sm:text-base">{getCategoryDisplayName(c, dict)}</div>
            </Link>
          </Tilt>
        ))}
      </div>
    </section>
  );
}