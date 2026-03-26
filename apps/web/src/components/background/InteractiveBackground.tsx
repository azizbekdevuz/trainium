'use client';

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';

const trackSpring = { stiffness: 150, damping: 22, mass: 0.5 };
const ambientSpring = { stiffness: 14, damping: 32, mass: 1.2 };
const opacitySpring = { stiffness: 80, damping: 18 };
const scaleSpring = { stiffness: 200, damping: 14, mass: 0.6 };

const BLOB_SIZE = 600;
const BLOB_HALF = BLOB_SIZE / 2;

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(hover: none) or (pointer: coarse)');
    setIsTouch(mq.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  
  return isTouch;
}

export default function InteractiveBackground() {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const isTouchDevice = useIsTouchDevice();
  const isTouchRef = useRef(false);

  const blobX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const blobY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

  const springX = useSpring(blobX, trackSpring);
  const springY = useSpring(blobY, trackSpring);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const smoothX = useSpring(normX, ambientSpring);
  const smoothY = useSpring(normY, ambientSpring);
  const ambientTx = useTransform(smoothX, [0, 1], [-120, 120]);
  const ambientTy = useTransform(smoothY, [0, 1], [-100, 100]);
  const ambientTx2 = useTransform(ambientTx, (v) => v * -0.55);
  const ambientTy2 = useTransform(ambientTy, (v) => v * -0.48);

  const blobOpacity = useMotionValue(0);
  const springOpacity = useSpring(blobOpacity, opacitySpring);

  const blobScale = useMotionValue(1);
  const springScale = useSpring(blobScale, scaleSpring);

  const blobTranslateX = useTransform(springX, (v) => v - BLOB_HALF);
  const blobTranslateY = useTransform(springY, (v) => v - BLOB_HALF);

  useEffect(() => { setMounted(true); }, []);

  const moveTo = useCallback((cx: number, cy: number) => {
    blobX.set(cx);
    blobY.set(cy);
    blobOpacity.set(1);
    normX.set(cx / (window.innerWidth || 1));
    normY.set(cy / (window.innerHeight || 1));
  }, [blobX, blobY, blobOpacity, normX, normY]);

  useEffect(() => {
    if (!mounted || reduceMotion || isTouchDevice) return undefined;

    let raf = 0;
    let latestX = 0;
    let latestY = 0;

    const flush = () => {
      raf = 0;
      moveTo(latestX, latestY);
    };

    const enqueue = (cx: number, cy: number) => {
      latestX = cx;
      latestY = cy;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    // --- Desktop only: mouse move ---
    const onMouse = (e: MouseEvent) => {
      if (isTouchRef.current) return;
      enqueue(e.clientX, e.clientY);
    };

    // --- Desktop only: click pulse ---
    const onMouseDown = (e: MouseEvent) => {
      if (isTouchRef.current) return;
      enqueue(e.clientX, e.clientY);
      blobScale.set(1.45);
    };
    const onMouseUp = () => {
      if (isTouchRef.current) return;
      blobScale.set(1);
    };

    // --- Desktop only: mouse leave ---
    const onLeave = () => {
      if (isTouchRef.current) return;
      blobOpacity.set(0);
    };

    // Detect if touch event fires (hybrid devices)
    const onTouchStart = () => {
      isTouchRef.current = true;
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchstart', onTouchStart, { passive: true, once: true });

    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchstart', onTouchStart);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted, reduceMotion, isTouchDevice, moveTo, blobOpacity, blobScale]);

  if (!mounted) return null;

  if (reduceMotion) {
    return (
      <div
        className="interactive-bg-static pointer-events-none fixed inset-0"
        style={{ zIndex: 1 }}
        aria-hidden
      />
    );
  }

  if (isTouchDevice) {
    return (
      <div
        className="interactive-bg-touch pointer-events-none fixed inset-0"
        style={{ zIndex: 1 }}
        aria-hidden
      />
    );
  }

  // Full interactive background for desktop only
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden
    >
      <motion.div
        className="interactive-bg-aurora absolute left-1/2 top-1/2 h-[140vh] w-[140vw] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ x: ambientTx, y: ambientTy }}
      />
      <motion.div
        className="interactive-bg-aurora-secondary absolute left-1/2 top-1/2 h-[120vh] w-[120vw] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ x: ambientTx2, y: ambientTy2, scale: 1.08 }}
      />

      <motion.div
        className="cursor-blob absolute left-0 top-0 rounded-full will-change-transform"
        style={{
          width: BLOB_SIZE,
          height: BLOB_SIZE,
          x: blobTranslateX,
          y: blobTranslateY,
          opacity: springOpacity,
          scale: springScale,
        }}
      />
    </div>
  );
}
