"use client";

import Reveal from '../ui/Reveal';
import { useI18n } from '../providers/I18nProvider';
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import barbellKnurl from '../../../public/images/barbell_knurl.webp';
import cableMachine from '../../../public/images/cable_machine.webp';
import dumbbells from '../../../public/images/dumbbells.webp';
import treadmill from '../../../public/images/treadmill.jpg';

export default function StickyFeatures() {
  const { t } = useI18n();
  const features = (t('home.stickyFeatures.items') as { title: string; desc: string }[]) || [];
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const markerPositions: Array<{ top: string; left: string }> = [
    { top: '22%', left: '68%' },
    { top: '40%', left: '24%' },
    { top: '58%', left: '62%' },
    { top: '72%', left: '38%' },
    { top: '30%', left: '38%' },
    { top: '50%', left: '50%' }
  ];
  const featureImages = [barbellKnurl, treadmill, dumbbells, cableMachine];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* sticky visual */}
        <div>
          <div className="lg:sticky lg:top-28">
            <div className="aspect-[4/3] rounded-2xl relative overflow-hidden border bg-[rgba(var(--color-card))]">
              {/* background fill (theme-aware, works with any image colors) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--color-card))] to-[rgba(var(--color-muted)/1)] dark:from-[rgba(var(--color-card))] dark:to-[rgba(var(--color-muted)/1)]" aria-hidden />
              <div className="absolute -inset-10 opacity-[0.15] [mask-image:radial-gradient(closest-side,white,transparent)] bg-[repeating-linear-gradient(0deg,rgba(14,165,233,0.22),rgba(14,165,233,0.22)_1px,transparent_1px,transparent_18px)]" aria-hidden />
              {!reduce && (
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
                  <div className="size-[70%] rounded-full bg-[rgba(var(--color-primary))]/15 blur-3xl" />
                </div>
              )}

              {/* animated image switch */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  className="absolute inset-0"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <Image
                    src={featureImages[active % featureImages.length]}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    aria-hidden
                  />
                </motion.div>
              </AnimatePresence>
              {/* active feature marker only */}
              {features.length > 0 && (() => {
                const pos = markerPositions[active % markerPositions.length];
                const f = features[active];
                return (
                  <motion.div
                    className="absolute"
                    style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                    aria-hidden
                    initial={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <motion.div
                      className="size-3 rounded-full bg-[rgba(var(--color-primary))] ring-4 ring-[rgba(var(--color-primary))]/30"
                      animate={reduce ? {} : { scale: [1, 1.06, 1] }}
                      transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="mt-2 whitespace-nowrap rounded-xl px-3 py-1 text-xs bg-[rgba(var(--color-card))] text-[rgba(var(--color-fg))] border border-[rgba(var(--color-border))]/10 shadow-sm backdrop-blur-sm dark:bg-[rgba(var(--color-card))] dark:text-[rgba(var(--color-fg))] dark:border-[rgba(var(--color-border))]/20">
                      {f.title}
                    </div>
                  </motion.div>
                );
              })()}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-[rgba(var(--color-border))]" />
            </div>
          </div>
        </div>

        {/* scrolling copy */}
        <div className="space-y-8">
          <h2 className="font-display text-3xl">{t('home.stickyFeatures.title', 'Engineered advantages')}</h2>
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={[
                  "text-left w-full rounded-2xl border p-5 transition-colors",  
                  "bg-[rgba(var(--color-card))] text-[rgb(var(--color-fg))] border-[rgb(var(--color-border))]",
                  i === active ? "ring-2 ring-[rgba(var(--color-primary))]/40" : "",
                ].join(' ')}
              >
                <div className="font-medium">{f.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{f.desc}</div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}