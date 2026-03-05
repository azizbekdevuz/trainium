import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from './path-safety';

describe('sanitizeFilename', () => {
  it('returns null for empty string', () => {
    expect(sanitizeFilename('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(sanitizeFilename('   ')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(sanitizeFilename(null as unknown as string)).toBeNull();
    expect(sanitizeFilename(undefined as unknown as string)).toBeNull();
  });

  it('returns null for path traversal', () => {
    expect(sanitizeFilename('..')).toBeNull();
    expect(sanitizeFilename('../etc/passwd')).toBeNull();
    expect(sanitizeFilename('file/../etc/passwd')).toBeNull();
    expect(sanitizeFilename('file\\..\\etc\\passwd')).toBeNull();
  });

  it('returns null for forward slash', () => {
    expect(sanitizeFilename('path/to/file')).toBeNull();
  });

  it('returns null for backslash', () => {
    expect(sanitizeFilename('path\\to\\file')).toBeNull();
  });

  it('returns trimmed filename for valid names', () => {
    expect(sanitizeFilename('avatar.jpg')).toBe('avatar.jpg');
    expect(sanitizeFilename('My Photo_123.png')).toBe('My Photo_123.png');
    expect(sanitizeFilename('  file.webp  ')).toBe('file.webp');
  });
});
