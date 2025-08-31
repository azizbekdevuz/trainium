'use client';

import { motion, useReducedMotion } from 'framer-motion';

type Props = React.PropsWithChildren<{ delay?: number; y?: number; className?: string }>;

export default function Reveal({ children, delay = 0, y = 14, className }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { y, opacity: 0 }}
      whileInView={reduce ? {} : { y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}