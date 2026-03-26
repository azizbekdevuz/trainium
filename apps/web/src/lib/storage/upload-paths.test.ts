import { describe, it, expect } from 'vitest';
import { relative } from 'path';
import { getUploadsRoot, resolveLocalUploadFilePath } from './upload-paths';

describe('upload-paths', () => {
  const cwd = '/tmp/fake-next-app';

  it('getUploadsRoot joins storage/uploads under cwd', () => {
    const root = getUploadsRoot(cwd);
    expect(relative(cwd, root)).toMatch(/storage[/\\]uploads$/);
  });

  it('resolveLocalUploadFilePath maps /uploads/name under storage/uploads', () => {
    const p = resolveLocalUploadFilePath('/uploads/foo_123.jpg', cwd);
    expect(p).not.toBeNull();
    expect(relative(getUploadsRoot(cwd), p!)).toBe('foo_123.jpg');
  });

  it('strips query string before resolving', () => {
    const p = resolveLocalUploadFilePath('/uploads/bar.webp?w=256', cwd);
    expect(p).not.toBeNull();
    expect(relative(getUploadsRoot(cwd), p!)).toBe('bar.webp');
  });

  it('returns null for traversal in URL', () => {
    expect(resolveLocalUploadFilePath('/uploads/../etc/passwd', cwd)).toBeNull();
  });

  it('returns null for non-local URLs', () => {
    expect(resolveLocalUploadFilePath('https://cdn.example/x.jpg', cwd)).toBeNull();
  });
});
