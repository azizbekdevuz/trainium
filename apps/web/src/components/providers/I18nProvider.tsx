'use client'

import React, { createContext, useContext, useMemo } from 'react'
import type { Dictionary } from '@/lib/i18n'

type Dict = Dictionary

type I18nContextValue = {
  lang: string
  dict: Dict
  t: (path: string, fallback?: unknown) => any
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getByPath(obj: any, path: string): unknown {
  return path.split('.').reduce<any>((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj)
}

export function I18nProvider({ lang, dict, children }: { lang: string; dict: Dict; children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(() => ({
    lang,
    dict,
    t: (path: string, fallback?: unknown) => {
      const v = getByPath(dict, path)
      return v === undefined ? (fallback ?? path) : v
    },
  }), [lang, dict])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}


