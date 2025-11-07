import { useMemo } from 'react';
import type { Appearance } from '@stripe/stripe-js';

export function useStripeAppearance(theme: 'light' | 'dark', lang: string): Appearance {
  return useMemo<Appearance>(() => {
    const isDark = theme === 'dark';
    const base: Appearance = {
      theme: isDark ? 'night' : 'stripe',
      variables: isDark
        ? {
            colorPrimary: '#06b6d4',        // cyan-500
            colorText: '#e2e8f0',           // slate-200
            colorTextSecondary: '#94a3b8',  // slate-400
            colorBackground: '#0f172a',     // slate-900
            colorIcon: '#94a3b8',
            colorDanger: '#ef4444',         // red-500
            colorSuccess: '#10b981',         // green-500
            colorWarning: '#f59e0b',        // amber-500
            borderRadius: '12px',
            spacingUnit: '4px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSizeBase: '16px',
          }
        : {
            colorPrimary: '#0891b2',        // cyan-600
            colorText: '#0b1220',
            colorTextSecondary: '#64748b',  // slate-500
            colorBackground: '#ffffff',
            colorIcon: '#64748b',
            colorDanger: '#ef4444',         // red-500
            colorSuccess: '#10b981',         // green-500
            colorWarning: '#f59e0b',        // amber-500
            borderRadius: '12px',
            spacingUnit: '4px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSizeBase: '16px',
          },
      rules: isDark
        ? {
            '.Label': { color: '#cbd5e1', fontSize: '14px', fontWeight: '500' },                // slate-300
            '.Input': { 
              backgroundColor: '#0f172a', 
              borderColor: '#334155', 
              color: '#e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '16px',
            },
            '.Input:focus': { 
              borderColor: '#06b6d4',
              boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.1)',
            },
            '.Block': { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' },
            '.Tab': { 
              backgroundColor: '#0f172a', 
              borderColor: '#334155', 
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '10px 16px',
            },
            '.Tab:hover': { color: '#f1f5f9', backgroundColor: '#1e293b' },
            '.Tab--selected': { color: '#f1f5f9', borderColor: '#06b6d4', backgroundColor: '#1e293b' },
            '.Link': { color: '#22d3ee' },                  // cyan-400
            '.Error': { color: '#ef4444', fontSize: '14px' },
            '.Text': { color: '#e2e8f0' },
          }
        : {
            '.Label': { color: '#0f172a', fontSize: '14px', fontWeight: '500' },
            '.Input': { 
              backgroundColor: '#ffffff', 
              borderColor: '#e2e8f0', 
              color: '#0b1220',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '16px',
            },
            '.Input:focus': { 
              borderColor: '#0891b2',
              boxShadow: '0 0 0 3px rgba(8, 145, 178, 0.1)',
            },
            '.Block': { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' },
            '.Tab': { 
              backgroundColor: '#ffffff', 
              borderColor: '#e2e8f0', 
              color: '#64748b',
              borderRadius: '8px',
              padding: '10px 16px',
            },
            '.Tab:hover': { color: '#0891b2', backgroundColor: '#f1f5f9' },
            '.Tab--selected': { color: '#0891b2', borderColor: '#0891b2', backgroundColor: '#f1f5f9' },
            '.Link': { color: '#0891b2' },
            '.Error': { color: '#ef4444', fontSize: '14px' },
            '.Text': { color: '#0b1220' },
          },
    };
    if (lang === 'uz') {
      base.rules = {
        ...(base.rules || {}),
        '.Label': { display: 'none' as const },
        '.TabLabel': { display: 'none' as const },
        '.Link': { display: 'none' as const },
      } as any;
    }
    return base;
  }, [lang, theme]);
}

