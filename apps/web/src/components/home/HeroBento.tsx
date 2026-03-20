"use client";

import { motion, useReducedMotion } from "framer-motion";
import MagneticButton from "../ui/animations/MagneticButton";
import { useI18n } from "../providers/I18nProvider";

export function HeroBento() {
  const reduce = useReducedMotion();
  const { t, lang } = useI18n();

  return (
    <div className="glass-elevated hero-bento-shell relative flex min-h-[420px] flex-col justify-center rounded-[22px] p-8 sm:p-12">
      <div className="hero-bento-wash pointer-events-none absolute inset-0 rounded-[22px]" aria-hidden />

      <div className="relative z-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={reduce ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="hero-bento-pill mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
        >
          <div className="live-dot" />
          <span className="hero-bento-pill-text text-[10px] font-bold uppercase tracking-[0.09em]">
            {t("home.hero.statusPill", "Premium Fitness Equipment · Korea")}
          </span>
        </motion.div>

        <motion.h1
          initial={reduce ? false : { y: 18, opacity: 0 }}
          whileInView={reduce ? {} : { y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
          className="font-display mb-4 text-[44px] font-extrabold leading-[1.05] tracking-[-0.04em] text-ui-primary sm:text-[56px]"
        >
          {t("home.hero.title.part1", "Train Without")}
          <br />
          <span className="text-gradient-accent">
            {t("home.hero.title.highlight", "Compromise.")}
          </span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { y: 10, opacity: 0 }}
          whileInView={reduce ? {} : { y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.05 }}
          className="mb-7 max-w-[390px] text-[15px] leading-[1.72] text-ui-muted"
        >
          {t(
            "home.hero.sub",
            "Precision-engineered equipment for serious athletes.",
          )}
        </motion.p>

        <div className="mb-7 flex flex-col gap-3 sm:flex-row">
          <MagneticButton
            href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`}
            className="btn-primary px-6 py-3 text-[13.5px]"
          >
            {t("home.hero.ctaPrimary", "Shop Best Sellers →")}
          </MagneticButton>
          <MagneticButton
            href={`/${lang}/special-bargain`}
            className="btn-ghost px-5 py-3 text-[13.5px]"
          >
            {t("nav.deals", "Deals & Wholesale")}
          </MagneticButton>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="hero-bento-bullet rounded-full border px-3 py-1 text-[11px] font-medium">
            · {t("home.hero.bullet1", "14-day returns")}
          </span>
          <span className="hero-bento-bullet rounded-full border px-3 py-1 text-[11px] font-medium">
            · {t("home.hero.bullet2", "Warranty support")}
          </span>
          <span className="hero-bento-bullet rounded-full border px-3 py-1 text-[11px] font-medium">
            · {t("home.hero.bullet3", "Real-time tracking")}
          </span>
        </div>
      </div>
    </div>
  );
}
