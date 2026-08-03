import { describe, expect, it } from 'vitest';

import { getSafeCallbackUrl } from '@/lib/safe-callback-url';

describe('safe callback URLs', () => {
  it('allows local paths', () => {
    expect(getSafeCallbackUrl('/books?page=2')).toBe('/books?page=2');
  });

  it.each([undefined, 'https://example.com', '//example.com', '/\\example.com'])(
    'falls back for unsafe value %s',
    (value) => {
      expect(getSafeCallbackUrl(value)).toBe('/');
    }
  );
});
