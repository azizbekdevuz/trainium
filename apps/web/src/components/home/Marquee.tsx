'use client';

import { useReducedMotion } from 'framer-motion';

const defaults = ['Rogue', 'Eleiko', 'Technogym', 'Concept2', 'Assault', 'York'];

export default function Marquee({ text }: { text?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div
          className="flex gap-12 whitespace-nowrap py-4 px-6"
          style={
            reduce
              ? {}
              : {
                  animation: 'marquee 22s linear infinite',
                }
          }
        >
          {text
            ? new Array(8).fill(0).map((_, i) => (
                <span key={i} className="text-sm text-gray-600">{text}</span>
              ))
            : [...defaults, ...defaults].map((l, i) => (
                <span key={i} className="text-sm text-gray-600">{l}</span>
              ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}