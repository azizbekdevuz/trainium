'use client';

import Image from 'next/image';
import logoBanner from '../../../public/images/logo-banner.png';
import { motion, useReducedMotion } from 'framer-motion';
import Spotlight from '../ui/Spotlight';
import MagneticButton from '../ui/MagneticButton';
import { useI18n } from '../providers/I18nProvider';

export function Hero({ title, sub }: { title?: string; sub?: string }) {
  const reduce = useReducedMotion();
  const { t, lang } = useI18n();

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-10 md:pt-14 relative">
      {/* Cursor spotlight */}
      <Spotlight className="absolute inset-0 rounded-3xl pointer-events-none" />

      <div className="relative grid gap-8 lg:gap-10 lg:grid-cols-2 items-center">
        <div className="text-center lg:text-left">
          <motion.h1
            initial={reduce ? false : { y: 18, opacity: 0 }}
            whileInView={reduce ? {} : { y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight"
          >
            {title ?? (<>
              {t('home.hero.title.part1', 'Precision gear for ')}<span className="text-cyan-600">{t('home.hero.title.highlight', 'serious')}</span>{t('home.hero.title.part2', ' training.')}
            </>)}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { y: 10, opacity: 0 }}
            whileInView={reduce ? {} : { y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-gray-600 text-sm sm:text-base max-w-prose mx-auto lg:mx-0"
          >
            {sub ?? t('home.hero.sub', 'Calm, minimal interface. Fast delivery. KR wallets & global payments. Built to convert—without noise.')}
          </motion.p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <MagneticButton href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`} className="bg-cyan-600 text-white shadow-sm w-full sm:w-auto">
              {t('home.hero.ctaPrimary', 'Shop best sellers')}
            </MagneticButton>
            <MagneticButton href={`/${lang}/special-bargain`} className="glass w-full sm:w-auto">
              {t('nav.deals', 'Deals & Wholesale')}
            </MagneticButton>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-gray-600 justify-center lg:justify-start">
            <span>• {t('home.hero.bullet1', '14-day returns')}</span>
            <span>• {t('home.hero.bullet2', 'Warranty support')}</span>
            <span>• {t('home.hero.bullet3', 'Real-time tracking')}</span>
          </div>
        </div>

        {/* Right visual: layered parallax */}
        <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          {!reduce && (
            <>
              {/* animated grid lines */}
              <motion.div
                className="absolute -inset-20 [mask-image:radial-gradient(closest-side,white,transparent)] bg-[repeating-linear-gradient(0deg,rgba(14,165,233,0.12),rgba(14,165,233,0.12)_1px,transparent_1px,transparent_20px)]"
                initial={{ y: -40, opacity: 0.18 }}
                animate={{ y: 40, opacity: 0.28 }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 8, ease: "easeInOut" }}
              />

              {/* pulsing cyan aura */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                <div className="size-[70%] rounded-full bg-cyan-500/30 blur-3xl" />
              </motion.div>
            </>
          )}

          {/* floating glass plate */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            whileHover={reduce ? undefined : { rotateX: -4, rotateY: 4, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative w-[75%] aspect-[4/3] rounded-2xl bg-white/10 backdrop-blur-lg ring-1 ring-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.25)]">
              {/* Logo itself */}
              <Image
                src={logoBanner}
                alt="Trainium logo banner"
                fill
                sizes="(min-width: 1024px) 32rem, 80vw"
                className="object-contain p-6 select-none"
                priority
                draggable={false}
              />
              {/* inner highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
            </div>
          </motion.div>

          {/* subtle bottom glow like a hologram base */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-cyan-400/20 blur-2xl rounded-full" />

          {/* outer border ring */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-[rgb(var(--color-border))]" />
        </div>
      </div>
    </section>
  );
}