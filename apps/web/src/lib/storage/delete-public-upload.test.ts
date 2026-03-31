import { describe, it, expect, vi } from 'vitest';
import type { PublicBlobStorage } from '@/lib/storage/blob-storage';
import { keysFromProductImagesJson, deleteUploadKeyAndLegacyVariants } from './delete-public-upload';

describe('keysFromProductImagesJson', () => {
  it('returns empty for non-array', () => {
    expect(keysFromProductImagesJson(null)).toEqual([]);
    expect(keysFromProductImagesJson({})).toEqual([]);
  });

  it('collects unique local upload keys from src fields', () => {
    const keys = keysFromProductImagesJson([
      { src: '/uploads/a.jpg' },
      { src: 'https://cdn.example/x.png' },
      { src: '/uploads/b.webp?w=512' },
      { src: '/uploads/a.jpg' },
    ]);
    expect(keys.sort()).toEqual(['a.jpg', 'b.webp']);
  });

  it('skips invalid entries', () => {
    expect(
      keysFromProductImagesJson([{}, { src: '' }, { src: 1 }, null, { src: '/uploads/ok.jpg' }])
    ).toEqual(['ok.jpg']);
  });
});

describe('deleteUploadKeyAndLegacyVariants', () => {
  it('calls storage.delete for legacy sidecars and main key', async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const storage: Pick<PublicBlobStorage, 'delete'> = { delete: del };

    await deleteUploadKeyAndLegacyVariants(storage as PublicBlobStorage, 'pic.jpg');

    const deletedKeys = del.mock.calls.map((c) => c[0] as string).sort();
    expect(deletedKeys).toContain('pic.jpg');
    expect(deletedKeys).toContain('pic_256.webp');
    expect(deletedKeys).toContain('pic_512.webp');
    expect(deletedKeys).toContain('pic_768.webp');
    expect(deletedKeys).toContain('pic_1024.webp');
    expect(deletedKeys).toContain('pic.webp');
    expect(deletedKeys.length).toBe(6);
  });
});
