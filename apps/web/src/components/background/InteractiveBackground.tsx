'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function InteractiveBackground() {
  // Track mount state to avoid SSR "window is not defined" errors
  const [mounted, setMounted] = useState(false);

  // Motion values with safe defaults
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 15 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 15 });

  useEffect(() => {
    setMounted(true);
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  // Render nothing until mounted on client
  if (!mounted) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(circle at center, rgba(14,165,233,0.15), transparent 70%)',
        backgroundSize: '200% 200%',
        backgroundPositionX: smoothX,
        backgroundPositionY: smoothY,
        willChange: 'background-position',
      }}
    />
  );
}