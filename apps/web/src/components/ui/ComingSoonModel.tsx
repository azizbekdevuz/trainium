import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../providers/I18nProvider';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  message?: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const { dict } = useI18n();

  const generateParticles = useCallback(() => {
    const particleCount = 20;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4
    }));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setParticles(generateParticles());

    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 5000);

    document.body.style.overflow = 'hidden';

    return () => {
      clearInterval(glitchInterval);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, generateParticles]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
        onClick={handleBackdropClick}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-lg md:max-w-2xl pointer-events-auto animate-[slideUp_0.4s_ease-out]"
          onClick={handleModalClick}
        >
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-blue-500/20">
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors group"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 will-change-transform">
                <div 
                  className="absolute inset-0 rounded-full blur-3xl will-change-transform"
                  style={{
                    background: 'radial-gradient(circle, #007FFF, transparent)',
                    animation: 'morph 8s ease-in-out infinite, rotate 20s linear infinite, pulse 4s ease-in-out infinite'
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full blur-2xl will-change-transform"
                  style={{
                    background: 'radial-gradient(circle, #000080, transparent)',
                    animation: 'pulse 4s ease-in-out infinite 1s'
                  }}
                />
              </div>
            </div>

            {particles.map(particle => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 rounded-full bg-white/40 pointer-events-none will-change-transform"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animation: `drift ${particle.duration}s ease-in-out infinite ${particle.delay}s`
                }}
              />
            ))}

            <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 text-center">
              
              <div className="mb-6 md:mb-8 flex justify-center">
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-3 md:mb-4">
                <div className="inline-block relative">
                  <h2 
                    className="text-3xl md:text-5xl font-bold text-white"
                    style={{
                      textShadow: '0 0 20px rgba(0, 127, 255, 0.5)',
                    }}
                  >
                    {dict.home?.comingSoon?.title ?? "Coming Soon"}
                  </h2>
                  {glitchActive && (
                    <>
                      <h2 
                        className="absolute inset-0 text-3xl md:text-5xl font-bold text-red-500 opacity-70 pointer-events-none"
                        style={{ transform: 'translate(-2px, -2px)' }}
                        aria-hidden="true"
                      >
                        {dict.home?.comingSoon?.title ?? "Coming Soon"}
                      </h2>
                      <h2 
                        className="absolute inset-0 text-3xl md:text-5xl font-bold text-cyan-500 opacity-70 pointer-events-none"
                        style={{ transform: 'translate(2px, 2px)' }}
                        aria-hidden="true"
                      >
                        {dict.home?.comingSoon?.title ?? "Coming Soon"}
                      </h2>
                    </>
                  )}
                </div>
              </div>

              <p className="text-lg md:text-xl text-blue-200 mb-4 md:mb-6 font-medium">
                {dict.home?.comingSoon?.subtitle ?? "Newsletter Subscription"}
              </p>

              <p className="text-sm md:text-base text-gray-300 mb-8 md:mb-10 max-w-md mx-auto leading-relaxed">
                {dict.home?.comingSoon?.message ?? "We're working hard to bring you this feature. Stay tuned!"}
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 will-change-transform"
                    style={{
                      animation: `bounce 1.4s ease-in-out infinite ${i * 0.2}s`
                    }}
                  />
                ))}
              </div>

              <div className="w-full max-w-xs mx-auto">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full will-change-transform"
                    style={{
                      animation: 'progress 3s ease-in-out infinite'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 40% / 70% 30% 50% 60%; }
        }

        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -15px); }
          50% { transform: translate(-15px, 15px); }
          75% { transform: translate(15px, 15px); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-8px); opacity: 0.5; }
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 0%; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default ComingSoonModal;