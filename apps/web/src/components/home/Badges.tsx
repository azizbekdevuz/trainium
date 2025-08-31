'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '../providers/I18nProvider';

const defaults = [
  { title: 'KR Payments', desc: 'Toss · Kakao · Naver · Cards' },
  { title: 'Fast Shipping', desc: 'Real-time order tracking' },
  { title: 'Free Returns', desc: 'Hassle-free 14 days' },
  { title: 'Warranty', desc: 'Up to 2 years coverage' },
];

export function Badges({ badges }: { badges?: string[] }) {
  const reduce = useReducedMotion();
  const { t } = useI18n();
  const items = (badges && badges.length > 0
    ? badges.map((b) => {
        const [title, desc] = String(b).split('|');
        return { title: title?.trim() || b, desc: desc?.trim() || '' };
      })
    : defaults.map((d) => ({
        title: t(`home.badges.${d.title}.title`, d.title),
        desc: t(`home.badges.${d.title}.desc`, d.desc),
      })));
  return (
    <div className="mx-auto max-w-7xl px-6 pb-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={reduce ? false : { y: 8, opacity: 0 }}
            whileInView={reduce ? {} : { y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.05 }}
            className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[rgba(14,165,233,.25)] to-transparent"
          >
            <div className="glass rounded-2xl p-4">
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-gray-600">{it.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}