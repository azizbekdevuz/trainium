'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useI18n } from '../providers/I18nProvider';
import Image from 'next/image';

export default function ParallaxGallery() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ offset: ['start end', 'end start'] });

  const y1 = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -20, reduce ? 0 : 20]);
  const y2 = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 20, reduce ? 0 : -20]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="font-display text-2xl mb-6">{t('home.parallax.title', 'In the wild')}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div style={{ y: y1 }} className="aspect-square md:aspect-square h-64 md:h-auto rounded-2xl overflow-hidden border relative bg-white dark:bg-slate-900">
          <Image src="/images/bike.webp" alt={t('home.parallax.img1Alt', 'Bike in home gym')} fill className="object-contain" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
        </motion.div>
        <motion.div style={{ y: y2 }} className="aspect-square md:aspect-square h-64 md:h-auto rounded-2xl overflow-hidden border relative bg-white dark:bg-slate-900">
          <Image src="/images/treadmill.jpg" alt={t('home.parallax.img2Alt', 'Treadmill setup')} fill className="object-contain" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
        </motion.div>
      </div>
    </section>
  );
}