import { describe, expect, it } from 'vitest';

import { normalizeTagNames } from '@/lib/organization';

describe('normalizeTagNames', () => {
  it('trims, drops empties, and keeps the first spelling of duplicates', () => {
    expect(normalizeTagNames([' favorites ', '', 'Favorites', 'book-club', 'favorites'])).toEqual([
      'favorites',
      'book-club',
    ]);
  });
});
