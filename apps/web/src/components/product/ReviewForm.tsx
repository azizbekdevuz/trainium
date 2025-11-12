'use client'

import { useState, useTransition, useEffect } from 'react'
import { useI18n } from '../providers/I18nProvider'
import { showToast } from '../../lib/ui/toast'

export function ReviewForm({ productId }: { productId: string }) {
  const { t } = useI18n()
  const [rating, setRating] = useState<number>(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existing, setExisting] = useState<{ id: string; createdAt: string; status: string } | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Pre-check for existing review; update when variant filter changes
  useEffect(() => {
    const params = new URLSearchParams({ productId })
    ;(async () => {
      setIsChecking(true)
      try {
        const res = await fetch(`/api/reviews/check?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) {
          setExisting(null)
          return
        }
        const text = await res.text()
        const data = text ? JSON.parse(text) : { review: null }
        setExisting(data.review ?? null)
      } catch {
        setExisting(null)
      } finally {
        setIsChecking(false)
      }
    })()
  }, [productId])

  // const toggleVariant = (_id: string) => {}

  const submit = () => {
    setError(null)
    setSuccess(null)
    // No variant selection logic
    startTransition(async () => {
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productId, rating, title, content }),
        })
        if (res.status === 401) {
          showToast(t('auth.form.signinRequired', 'Please sign in to continue'))
          return
        }
        if (res.status === 409) {
          showToast(t('reviews.already', 'You already reviewed this product. Edit your review or add an update.'))
          return
        }
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        setSuccess(t('reviews.success', 'Thanks! Your review was submitted.'))
        setTitle('')
        setContent('')
        // Immediately hide the form by marking an ACTIVE existing review
        setExisting({ id: String(data.id), createdAt: new Date().toISOString(), status: 'ACTIVE' })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('review:created'))
        }
      } catch {
        setError(t('common.tryAgain', 'Try Again'))
      }
    })
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl mb-3">{t('reviews.write', 'Write a review')}</h3>
      {isChecking ? (
        <div className="h-24 rounded-xl bg-gray-50 border animate-pulse" />
      ) : existing && existing.status !== 'DELETED' ? (
        <div className="text-sm text-gray-700">
          {t('reviews.already', "You already reviewed this product. Edit your review or add an update.")}
        </div>
      ) : (
      <>
      {/* Variant selection removed */}
      <div className="grid gap-3">
        <label className="text-sm text-gray-700">
          {t('reviews.rating', 'Rating')}
          <div className="mt-1 inline-flex gap-1">
            {[1,2,3,4,5].map((r) => (
              <button
                key={r}
                type="button"
                className={`h-8 w-8 rounded-full border ${r <= rating ? 'bg-yellow-100 border-yellow-300' : 'hover:bg-gray-50'}`}
                onClick={() => setRating(r)}
                aria-label={`${r}`}
                title={`${r}`}
              >
                {r <= rating ? '★' : '☆'}
              </button>
            ))}
          </div>
        </label>
        <label className="text-sm text-gray-700">
          {t('reviews.titleLabel', 'Title (optional)')}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border px-3"
            placeholder={t('reviews.titlePh', 'e.g. Solid quality, quiet drive')}
          />
        </label>
        <label className="text-sm text-gray-700">
          {t('reviews.bodyLabel', 'Your review')}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 min-h-28 w-full rounded-xl border p-3"
            placeholder={t('reviews.bodyPh', 'Share details about your experience...')}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={isPending || content.trim().length === 0}
            className="h-10 px-4 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 disabled:opacity-50"
          >
            {t('reviews.submit', 'Submit review')}
          </button>
          {success && <span className="text-sm text-green-700">{success}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
      </>
      )}
    </div>
  )
}


