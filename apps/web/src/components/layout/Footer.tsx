"use client";
import { useState, useMemo } from 'react';
import { Brain, Github, Linkedin, Globe, ArrowDown } from 'lucide-react';

// Developer info (no env, single source of truth)
const DEV = {
  name: 'Azizbek Arzikulov',
  role: 'Full‑Stack Engineer',
  github: 'https://github.com/azizbek-devuz',
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6">
          {/* Left: brand + tagline (unchanged typography) */}
          <div className="flex-1 min-w-0 w-full">
            <div className="text-xs text-gray-600 dark:text-slate-400">{tagline}</div>
            <div className="mt-1 text-xs text-gray-500">© {year} {brand}</div>
          </div>

          {/* Right: integrated high-tech developer pill */}
          <div className="w-full md:w-auto">
            <div className="relative overflow-hidden rounded-full border p-2 pr-2 bg-white/80 dark:bg-slate-900/80 md:bg-transparent md:dark:bg-transparent holo">
              {/* low-cost ambient line */}
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="scroll-glow" />
              </div>
              <div className="relative flex items-center gap-2 sm:gap-3 overflow-hidden">
                <div className="h-7 w-7 rounded-full bg-cyan-500/15 border border-cyan-400/30 grid place-items-center flex-shrink-0">
                  <span className="status-pulse" />
                </div>
                <div className="flex-1 min-w-0 dev-underline pr-2 sm:pr-0">
                  <div className="font-medium text-sm truncate">{DEV.name}</div>
                  <div className="mt-0.5 cyber-chip">
                    <Brain size={14} className="opacity-80" />
                    <span className="truncate">{DEV.role}</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <a href={DEV.github} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                    <Github size={18} />
                  </a>
                  <a href={DEV.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                    <Linkedin size={18} />
                  </a>
                  <a href={DEV.portfolio} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Portfolio">
                    <Globe size={18} />
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
                    <ArrowDown size={18} style={{ transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                </div>
              </div>
            </div>
            <div
              id="dev-details"
              className={`dev-details ${open ? 'open' : ''} rounded-2xl border mt-3 p-4 md:p-5 bg-white/80 dark:bg-slate-900/80 md:bg-transparent md:dark:bg-transparent holo`}
            >
              <div className="text-sm">
                <div className="font-display text-lg mb-1">{title}</div>
                {intro ? <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{intro}</p> : null}
                {principles?.length ? (
                  <ul className="mt-3 space-y-1 text-gray-600 dark:text-slate-400 list-disc list-inside">
                    {principles.map((p, i) => (<li key={i}>{p}</li>))}
                  </ul>
                ) : null}
                {tech?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
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


