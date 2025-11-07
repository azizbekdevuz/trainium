import { useState, useEffect, useRef } from 'react';
import type { ReviewItem } from '../types';

export function useUndo(
    productId: string,
    items: ReviewItem[],
    setItems: (updater: (prev: ReviewItem[]) => ReviewItem[]) => void,
    loaded: boolean,
    t: (path: string, fallback?: string) => string
) {
    const [pendingUndoId, setPendingUndoId] = useState<string | null>(null);
    const undoTimerRef = useRef<any>(null);
    const STORAGE_KEY = `review-undo-${productId}`;

    // Restore undo state after load
    useEffect(() => {
        if (!loaded) return;
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw) as { id: string; expiresAt: number; index: number; snapshot?: any };
            const remainingMs = data.expiresAt - Date.now();
            if (remainingMs <= 0) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }
            setPendingUndoId(data.id);
            setItems((prev) => {
                if (prev.some((it) => it.id === data.id)) {
                    return prev.map((it) => (it.id === data.id ? { ...it, deletedLocal: true } : it));
                }
                const snap = data.snapshot as Partial<ReviewItem> | undefined;
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
                };
                const insertAt = Math.max(0, Math.min((data.index as number) ?? 0, prev.length));
                const arr = prev.slice();
                arr.splice(insertAt, 0, placeholder);
                return arr;
            });
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            const timer = setTimeout(() => {
                setPendingUndoId(null);
                setItems((prev) => prev.filter((it) => it.id !== data.id));
                localStorage.removeItem(STORAGE_KEY);
            }, remainingMs);
            undoTimerRef.current = timer;
        } catch {
            // ignore localStorage errors
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded, STORAGE_KEY]);

    const saveUndoState = (review: ReviewItem, index: number) => {
        try {
            if (typeof window !== 'undefined') {
                const payload = {
                    id: review.id,
                    expiresAt: Date.now() + 10 * 60 * 1000,
                    index: index < 0 ? 0 : index,
                    snapshot: {
                        user: review.user,
                        rating: review.rating,
                        title: review.title,
                        body: review.body,
                        createdAt: review.createdAt,
                        editedAt: review.editedAt,
                    },
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            }
        } catch {
            // ignore localStorage errors
        }
    };

    const clearUndo = () => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setPendingUndoId(null);
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    };

    const scheduleUndoExpiry = (reviewId: string) => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        const timer = setTimeout(() => {
            setItems((prev) => prev.filter((it) => it.id !== reviewId));
            setPendingUndoId(null);
            if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        }, 10 * 60 * 1000);
        undoTimerRef.current = timer;
    };

    return {
        pendingUndoId,
        setPendingUndoId,
        saveUndoState,
        clearUndo,
        scheduleUndoExpiry,
        STORAGE_KEY,
    };
}

