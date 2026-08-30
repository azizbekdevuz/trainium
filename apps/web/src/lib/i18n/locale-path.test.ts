import { describe, it, expect } from 'vitest'
import { replaceLocalePrefix } from './locale-path'

describe('replaceLocalePrefix', () => {
  it('switches locale on the home path', () => {
    expect(replaceLocalePrefix('/en', 'ko')).toBe('/ko')
    expect(replaceLocalePrefix('/ko', 'uz')).toBe('/uz')
    expect(replaceLocalePrefix('/uz', 'en')).toBe('/en')
  })

  it('switches locale on a shallow route', () => {
    expect(replaceLocalePrefix('/en/products', 'ko')).toBe('/ko/products')
  })

  it('switches locale on a deep route without mutating the rest', () => {
    expect(replaceLocalePrefix('/ko/account/orders/123', 'en')).toBe(
      '/en/account/orders/123'
    )
  })

  it('prefixes a path that lacks a locale exactly once', () => {
    expect(replaceLocalePrefix('/products', 'ko')).toBe('/ko/products')
    expect(replaceLocalePrefix('/', 'uz')).toBe('/uz')
  })

  it('does not duplicate an existing locale prefix', () => {
    expect(replaceLocalePrefix('/en/products', 'en')).toBe('/en/products')
    expect(replaceLocalePrefix('/ko', 'ko')).toBe('/ko')
  })

  it('does not mutate unrelated pathname segments', () => {
    expect(replaceLocalePrefix('/en/products/foo-bar', 'uz')).toBe(
      '/uz/products/foo-bar'
    )
  })

  it('leaves query and hash intact when applied to a public URL pathname', () => {
    const url = new URL('https://trainium.shop/en/products?q=bike&category=cardio#reviews')
    url.pathname = replaceLocalePrefix(url.pathname, 'ko')
    expect(url.pathname).toBe('/ko/products')
    expect(url.search).toBe('?q=bike&category=cardio')
    expect(url.hash).toBe('#reviews')
  })
})
