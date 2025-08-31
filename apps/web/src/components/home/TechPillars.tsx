'use client';

import { useI18n } from '../providers/I18nProvider';
import { Cpu, Gauge, PackageCheck, Leaf } from 'lucide-react';

const icons = [Cpu, Gauge, PackageCheck, Leaf];

export default function TechPillars() {
  const { t } = useI18n();
  const items = (t('home.techPillars.items') as { title: string; desc: string }[]) || [];
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={item.title} className="rounded-2xl p-[1px] bg-gradient-to-br from-[rgba(14,165,233,.25)] to-transparent">
              <div className="glass rounded-2xl p-5">
                <Icon className="h-5 w-5 text-cyan-600 mb-2" />
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


