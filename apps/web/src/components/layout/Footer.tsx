"use client";
import { useState, useMemo } from 'react';
import { Brain, Github, Linkedin, Globe, ArrowDown } from 'lucide-react';

// Developer info (no env, single source of truth)
const DEV = {
  name: 'Azizbek Arzikulov',
  role: 'Full‑Stack Engineer',
  github: 'https://github.com/azizbekdevuz',
  linkedin: 'https://www.linkedin.com/in/azizbek-arzikulov/',
  portfolio: 'https://portfolio-next-silk-two.vercel.app/',
};

export default function Footer({ year, brand, tagline, devDict }: { year: number; brand: string; tagline: string; devDict?: { title?: string; intro?: string; principles?: string[]; tech?: string[] } }) {
  const [open, setOpen] = useState(false);
  const title = devDict?.title || 'About the Developer';
  const intro = devDict?.intro || '';
  const principles = useMemo(() => Array.isArray(devDict?.principles) ? devDict?.principles as string[] : [], [devDict]);
  const tech = useMemo(() => Array.isArray(devDict?.tech) ? devDict?.tech as string[] : [], [devDict]);
  return (
    <footer className="inset-x-0 border-t glass">
      {/* First section: brand + tagline (full width, responsive layout) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 text-xs text-gray-600 dark:text-slate-400">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-2 sm:gap-0">
          <span className="text-center sm:text-left">© {year} {brand}</span>
          <span className="text-center sm:text-right">{tagline}</span>
        </div>
      </div>
      
      {/* Second section: developer pill */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Developer pill section */}
          <div className="w-full">
            <div className="relative overflow-hidden rounded-full border p-2 sm:p-2.5 bg-white/80 dark:bg-slate-900/80 md:bg-transparent md:dark:bg-transparent holo">
              {/* low-cost ambient line */}
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="scroll-glow" />
              </div>
              <div className="relative flex items-center gap-2 sm:gap-3 overflow-hidden">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-cyan-500/15 border border-cyan-400/30 grid place-items-center flex-shrink-0">
                  <span className="status-pulse" />
                </div>
                <div className="flex-1 min-w-0 dev-underline pr-2 sm:pr-0">
                  <div className="font-medium text-sm sm:text-base truncate">{DEV.name}</div>
                  <div className="mt-0.5 cyber-chip">
                    <Brain className="w-3 h-3 sm:w-[14px] sm:h-[14px] opacity-80" />
                    <span className="text-xs sm:text-sm truncate">{DEV.role}</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 sm:gap-1.5 sm:gap-2 flex-shrink-0">
                  <a href={DEV.github} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                    <Github className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </a>
                  <a href={DEV.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                    <Linkedin className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </a>
                  <a href={DEV.portfolio} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Portfolio">
                    <Globe className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </a>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls="dev-details"
                    onClick={() => setOpen((v) => !v)}
                    className="social-link"
                    title={open ? 'Close' : 'Open'}
                    aria-label={open ? 'Close developer details' : 'Open developer details'}
                  >
                    <ArrowDown className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                </div>
              </div>
            </div>
            <div
              id="dev-details"
              className={`dev-details ${open ? 'open' : ''} rounded-2xl border mt-3 p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 md:bg-transparent md:dark:bg-transparent holo`}
            >
              <div className="text-sm">
                <div className="font-display text-lg mb-2">{title}</div>
                {intro ? <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-3">{intro}</p> : null}
                {tech?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tech.map((t) => (<span key={t} className="cyber-chip">{t}</span>))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


