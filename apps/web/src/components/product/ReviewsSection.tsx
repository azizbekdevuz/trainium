'use client'

import { useEffect, useState, useTransition } from 'react'
import { useI18n } from '../providers/I18nProvider'
import { useState as useReactState } from 'react'
import { useSession } from 'next-auth/react'
import { showToast } from '../../lib/toast'

type ReviewItem = {
  id: string
  user: { id: string; name?: string | null; image?: string | null; email?: string | null }
  rating: number
  title?: string | null
  body: string
  likes: { id: string }[]
  createdAt: string
  replies: ReviewItem[]
  editedAt?: string | null
  deletedLocal?: boolean
}

export function ReviewsSection({ productId }: { productId: string }) {
  const { t } = useI18n()
  const { data: session } = useSession()
  const [items, setItems] = useState<ReviewItem[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [pendingUndoId, setPendingUndoId] = useState<string | null>(null)
  const [undoTimer, setUndoTimer] = useState<any>(null)
  const STORAGE_KEY = `review-undo-${productId}`

  useEffect(() => {
    const load = () => startTransition(async () => {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      const data = await res.json()
      if (res.ok) {
        setItems(data.items ?? [])
        setCursor(data.nextCursor)
        setLoaded(true)
      }
    })
    load()
    const handler = () => load()
    if (typeof window !== 'undefined') window.addEventListener('review:created', handler)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('review:created', handler) }
  }, [productId])

  // Restore inline Undo placeholder after refresh if still within the 10-minute window
  useEffect(() => {
    if (!loaded) return
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as { id: string; expiresAt: number; index: number; snapshot?: any }
      const remainingMs = data.expiresAt - Date.now()
      if (remainingMs <= 0) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      setPendingUndoId(data.id)
      setItems((prev) => {
        if (prev.some((it) => it.id === data.id)) {
          return prev.map((it) => it.id === data.id ? { ...it, deletedLocal: true } : it)
        }
        const snap = data.snapshot as Partial<ReviewItem> | undefined
        const placeholder: ReviewItem = {
          id: data.id,
          user: snap?.user || { id: '', name: t('reviews.anonymous', 'Anonymous'), image: null, email: null },
          rating: Math.max(0, Math.min(5, Number(snap?.rating ?? 0))) as number,
          title: (snap?.title as any) ?? null,
          body: String((snap as any)?.body ?? t('reviews.deleted', 'Review deleted. Undo available for 10 minutes.')),
          likes: [],
          createdAt: (snap?.createdAt as any) || new Date().toISOString(),
          replies: [],
          editedAt: (snap?.editedAt as any) ?? null,
          deletedLocal: true,
        }
        const insertAt = Math.max(0, Math.min((data.index as number) ?? 0, prev.length))
        const arr = prev.slice()
        arr.splice(insertAt, 0, placeholder)
        return arr
      })
      if (undoTimer) clearTimeout(undoTimer)
      const timer = setTimeout(() => {
        setPendingUndoId(null)
        setItems((prev) => prev.filter((it) => it.id !== data.id))
        localStorage.removeItem(STORAGE_KEY)
      }, remainingMs)
      setUndoTimer(timer)
    } catch { /* ignore localStorage errors */ }
  }, [loaded, STORAGE_KEY, t, undoTimer])

  return (
    <section id="reviews" className="mt-10">
      <h3 className="font-display text-2xl mb-3">{t('reviews.title', 'Reviews')}</h3>
      {!loaded ? null : items.length === 0 ? (
        <div className="text-sm text-gray-600">{t('reviews.beFirst', 'Be the first to tell others about this product')}</div>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border p-4 bg-white">
              {r.deletedLocal ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">{t('reviews.deleted', 'Review deleted. Undo available for 10 minutes.')}</div>
                  {pendingUndoId === r.id && (
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          const res = await fetch(`/api/reviews/${r.id}/delete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'undo' }) })
                          if (res.ok) {
                            const r2 = await fetch(`/api/reviews?productId=${productId}`)
                            const d2 = await r2.json()
                            if (r2.ok) { setItems(d2.items ?? []); setCursor(d2.nextCursor) }
                            if (undoTimer) clearTimeout(undoTimer)
                            setPendingUndoId(null)
                            if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
                            showToast(t('reviews.restored', 'Review restored'))
                          } else {
                            showToast(t('common.tryAgain', 'Try Again'))
                          }
                        })
                      }}
                      className="rounded-full bg-black/90 text-white text-xs px-3 h-8 shadow"
                    >
                      {t('common.undo', 'Undo')}
                    </button>
                  )}
                </div>
              ) : (
              <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{r.user?.name ?? t('reviews.anonymous', 'Anonymous')}</span>
                {r.user?.email && (
                  <span className="text-gray-500">
                    ({r.user.email.slice(0,2)}{Array.from({length: Math.max(0, r.user.email.length - 2)}).map(() => '*').join('')})
                  </span>
                )}
                <span>·</span>
                <span>{'★'.repeat(Math.max(0, r.rating))}{'☆'.repeat(Math.max(0, 5 - r.rating))}</span>
                {r.editedAt ? (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {t('common.edited', 'Edited')} {new Date(r.editedAt).toLocaleDateString()}
                  </span>
                ) : null}
                <span className="ml-auto" />
                <ReviewLikeButtonInline reviewId={r.id} />
              </div>
              {r.title && <div className="mt-1 font-medium">{r.title}</div>}
              <p className="mt-1 text-gray-700 text-sm">{r.body}</p>
              <div className="mt-2 flex gap-2">
                {session?.user?.id === r.user?.id ? (
                  <>
                    <EditReviewButton
                      review={r}
                      onUpdated={(payload) => setItems((prev) => prev.map((it) => it.id === r.id ? { ...it, ...payload } as any : it))}
                    />
                    {/* For owner, only allow Add update (thread), not generic Reply duplicate */}
                    <AddUpdateButton parentId={r.id} onPosted={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('review:created')) }} />
                    <button
                      className="text-xs rounded-lg border px-2 h-7 hover:bg-red-50 text-red-700"
                      onClick={() => {
                        startTransition(async () => {
                          const res = await fetch(`/api/reviews/${r.id}/delete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) })
                          if (res.ok) {
                            // Persist undo across refresh with a minimal snapshot and intended position
                            try {
                              if (typeof window !== 'undefined') {
                                const index = items.findIndex((it) => it.id === r.id)
                                const payload = { id: r.id, expiresAt: Date.now() + 10 * 60 * 1000, index: index < 0 ? 0 : index, snapshot: { user: r.user, rating: r.rating, title: r.title, body: r.body, createdAt: r.createdAt, editedAt: r.editedAt } }
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
                              }
                            } catch { /* ignore localStorage errors */ }
                            setItems((prev) => prev.map((it) => it.id === r.id ? { ...it, deletedLocal: true } : it))
                            setPendingUndoId(r.id)
                            if (undoTimer) clearTimeout(undoTimer)
                            const timer = setTimeout(() => {
                              setItems((prev) => prev.filter((it) => it.id !== r.id))
                              setPendingUndoId(null)
                              if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
                            }, 10 * 60 * 1000)
                            setUndoTimer(timer)
                            showToast(t('reviews.deleted', 'Review deleted. Undo available for 10 minutes.'))
                          } else {
                            showToast(t('common.tryAgain', 'Try Again'))
                          }
                        })
                      }}
                    >
                      {t('common.delete', 'Delete')}
                    </button>
                  </>
                ) : (
                  <ReplyButtonInline parentId={r.id} onPosted={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('review:created')) }} />
                )}
              </div>
              <RepliesThread parentId={r.id} initialCount={(r as any)._count?.replies ?? (r.replies?.length ?? 0)} />
              </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-3">
        {cursor && (
        <div className="mt-4">
          <button
            className="rounded-xl border px-4 h-10 text-sm hover:bg-gray-50"
            onClick={() => {
              startTransition(async () => {
                const res = await fetch(`/api/reviews?productId=${productId}&cursor=${cursor}`)
                const data = await res.json()
                if (res.ok) {
                  setItems((prev) => [...prev, ...(data.items ?? [])])
                  setCursor(data.nextCursor)
                }
              })
            }}
            disabled={isPending}
          >
            {t('reviews.loadMore', 'Load more')}
          </button>
          </div>
        )}
        {items.length > 10 && (
          <button
            className="rounded-xl border px-4 h-10 text-sm hover:bg-gray-50"
            onClick={() => {
              setCollapsed((c) => !c)
              if (!collapsed) {
                setItems((prev) => prev.slice(0, 10))
                setCursor(undefined)
              }
            }}
          >
            {collapsed ? t('common.showAll', 'Show all') : t('common.showLess', 'Show less')}
          </button>
        )}
      </div>
      {/* Inline Undo shown per item now; global floating removed */}
    </section>
  )
}

function EditReviewButton({ review, onUpdated }: { review: ReviewItem; onUpdated: (payload: Partial<ReviewItem> & { editedAt?: string }) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useReactState(false)
  const [title, setTitle] = useReactState(review.title ?? '')
  const [body, setBody] = useReactState(review.body)
  const [rating, setRating] = useReactState<number | undefined>(review.rating)
  const [isPending, startTransition] = useTransition()
  const canChangeRating = (Date.now() - new Date(review.createdAt).getTime()) >= (7 * 24 * 60 * 60 * 1000)

  return (
    <>
      <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50" onClick={() => setOpen(true)}>{t('common.edit', 'Edit')}</button>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white shadow-2xl border p-4">
            <h4 className="font-medium mb-2">{t('common.edit', 'Edit')}</h4>
            <label className="block text-sm text-gray-700 mb-2">
              {t('reviews.titleLabel', 'Title (optional)')}
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-xl border px-3" />
            </label>
            <label className="block text-sm text-gray-700 mb-2">
              {t('reviews.bodyLabel', 'Your review')}
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-28 w-full rounded-xl border p-3" />
            </label>
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">{t('reviews.rating', 'Rating')} ({t('reviews.ratingChangeInfo', 'Can change after 7 days')})</div>
              <div className="inline-flex gap-1 opacity-100">
                {[1,2,3,4,5].map((r) => (
                  <button key={r} type="button" disabled={!canChangeRating} className={`h-8 w-8 rounded-full border ${r <= (rating ?? 0) ? 'bg-yellow-100 border-yellow-300' : 'hover:bg-gray-50'} ${!canChangeRating ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => canChangeRating && setRating(r)} aria-label={`${r}`}>{r <= (rating ?? 0) ? '★' : '☆'}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-3 h-9 hover:bg-gray-50" onClick={() => setOpen(false)}>{t('common.cancel', 'Cancel')}</button>
              <button
                className="rounded-lg bg-cyan-600 text-white px-4 h-9 hover:bg-cyan-700 disabled:opacity-50"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await fetch(`/api/reviews/${review.id}/edit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, body, rating }) })
                    if (res.status === 429) return showToast(t('reviews.rateLimited', 'You can edit again in 1 minute.'))
                    if (res.status === 403) return showToast(t('reviews.ratingTooSoon', 'You can change rating after 7 days.'))
                    if (res.ok) {
                      const data = await res.json()
                      onUpdated({ title, body, editedAt: data.editedAt })
                      setOpen(false)
                      showToast(t('reviews.updated', 'Review updated'))
                    } else {
                      showToast(t('common.tryAgain', 'Try Again'))
                    }
                  })
                }}
              >{t('common.save', 'Save')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AddUpdateButton({ parentId, onPosted }: { parentId: string; onPosted: () => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useReactState(false)
  const [content, setContent] = useReactState('')
  const [isPending, startTransition] = useTransition()
  return (
    <>
      <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50" onClick={() => setOpen(true)}>{t('reviews.addUpdate', 'Add update')}</button>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white shadow-2xl border p-4">
            <h4 className="font-medium mb-2">{t('reviews.addUpdate', 'Add update')}</h4>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 min-h-28 w-full rounded-xl border p-3" placeholder={t('reviews.bodyPh', 'Share details about your experience...')} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-lg border px-3 h-9 hover:bg-gray-50" onClick={() => setOpen(false)}>{t('common.cancel', 'Cancel')}</button>
              <button className="rounded-lg bg-cyan-600 text-white px-4 h-9 hover:bg-cyan-700 disabled:opacity-50" disabled={isPending || !content.trim()} onClick={() => {
                startTransition(async () => {
                  const res = await fetch(`/api/reviews/${parentId}/reply`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) })
                  if (res.ok) {
                    showToast(t('reviews.updatePosted', 'Update posted'))
                    setOpen(false)
                    setContent('')
                    onPosted()
                  } else if (res.status === 401) {
                    showToast(t('auth.form.signinRequired', 'Please sign in to continue'))
                  } else {
                    showToast(t('common.tryAgain', 'Try Again'))
                  }
                })
              }}>{t('common.save', 'Save')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function RepliesThread({ parentId, initialCount }: { parentId: string; initialCount: number }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [replies, setReplies] = useState<ReviewItem[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  if (!initialCount) return null
  return (
    <div className="mt-3">
      {!open ? (
        <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50" onClick={() => {
          setOpen(true)
          startTransition(async () => {
            const r = await fetch(`/api/reviews/${parentId}/replies?take=5`)
            const d = await r.json()
            if (r.ok) { setReplies(d.items ?? []); setCursor(d.nextCursor) }
          })
        }}>{t('reviews.showReplies', 'Show replies')} ({initialCount})</button>
      ) : (
        <div>
          <ul className="space-y-2">
            {replies.map((rp) => (
            <li key={rp.id} className="rounded-lg border p-3 bg-gray-50 dark:bg-slate-800 text-sm">
                <div className="text-gray-600 dark:text-slate-300">
                  <span className="font-medium">{rp.user?.name ?? t('reviews.anonymous', 'Anonymous')}</span>
                </div>
                <p className="mt-1 text-gray-700 dark:text-slate-200">{rp.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            {cursor && (
              <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-100" disabled={isPending} onClick={() => {
                startTransition(async () => {
                  const r = await fetch(`/api/reviews/${parentId}/replies?take=5&cursor=${cursor}`)
                  const d = await r.json()
                  if (r.ok) { setReplies((prev) => [...prev, ...(d.items ?? [])]); setCursor(d.nextCursor) }
                })
              }}>{t('common.showMore', 'Show more')}</button>
            )}
            <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-100" onClick={() => { setOpen(false); setReplies([]); setCursor(undefined) }}>{t('common.showLess', 'Show less')}</button>
          </div>
        </div>
      )}
    </div>
    
  )
}

function ReplyButtonInline({ parentId, onPosted }: { parentId: string; onPosted: () => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useReactState(false)
  const [content, setContent] = useReactState('')
  const [isPending, startTransition] = useTransition()
  return (
    <>
      <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50" onClick={() => { setOpen(true) }}>{t('reviews.reply', 'Reply')}</button>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white shadow-2xl border p-4">
            <h4 className="font-medium mb-2">{t('reviews.reply', 'Reply')}</h4>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 min-h-28 w-full rounded-xl border p-3" placeholder={t('reviews.bodyPh', 'Share details about your experience...')} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-lg border px-3 h-9 hover:bg-gray-50" onClick={() => setOpen(false)}>{t('common.cancel', 'Cancel')}</button>
              <button className="rounded-lg bg-cyan-600 text-white px-4 h-9 hover:bg-cyan-700 disabled:opacity-50" disabled={isPending || !content.trim()} onClick={() => {
                startTransition(async () => {
                  const res = await fetch(`/api/reviews/${parentId}/reply`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) })
                  if (res.ok) {
                    showToast(t('reviews.updatePosted', 'Update posted'))
                    setOpen(false)
                    setContent('')
                    onPosted()
                  } else {
                    showToast(t('common.tryAgain', 'Try Again'))
                  }
                })
              }}>{t('common.save', 'Save')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ReviewLikeButtonInline({ reviewId, initialCount = 0, initialLiked = false }: { reviewId: string; initialCount?: number; initialLiked?: boolean }) {
  const { t } = useI18n()
  const [liked, setLiked] = useReactState(initialLiked)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [count, setCount] = useReactState(initialCount)
  const [isPending, startTransition] = useTransition()
  return (
    <button
      className={`inline-flex items-center gap-1 text-xs rounded-full border px-2 h-7 transition-colors ${liked 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/30' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'}`}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' })
          if (res.ok) {
            const data = await res.json()
            setLiked(Boolean(data.liked))
            // Hide count per requirement; keep minimal state toggle
            // setCount(Number(data.count) || 0)
          } else if (res.status === 401) {
            showToast(t('auth.form.signinRequired', 'Please sign in to continue'))
          }
        })
      }}
      title={liked ? t('likes.unlike', 'Unlike') : t('likes.like', 'Like')}
      aria-label={liked ? t('likes.unlike', 'Unlike') : t('likes.like', 'Like')}
    >
      <span>👍</span>
    </button>
  )
}
