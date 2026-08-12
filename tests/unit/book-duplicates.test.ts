import { describe, expect, it } from 'vitest';

import { classifyDuplicateCandidate, normalizeDuplicateText } from '@/lib/book-duplicates';

const candidate = {
  id: 'book-1',
  title: 'Jane Eyre',
  author: 'Charlotte Brontë',
  publishYear: 1847,
  coverSourceId: '8235363',
  isbn13: '9780141441146',
  openLibraryEditionId: 'OL22731948M',
};

describe('book duplicate classification', () => {
  it('normalizes punctuation, spacing, accents, and ampersands', () => {
    expect(normalizeDuplicateText('  Malcolm X & Alex  Haley ')).toBe('malcolm x and alex haley');
    expect(normalizeDuplicateText('Brontë')).toBe('bronte');
  });

  it('prioritizes exact edition identifiers', () => {
    expect(
      classifyDuplicateCandidate(candidate, {
        title: 'Different metadata',
        author: 'Another author',
        publishYear: 2006,
        isbn13: '9780141441146',
      })
    ).toMatchObject({ id: 'book-1', reason: 'same_edition' });
  });

  it('finds metadata matches and allows distinct editions', () => {
    expect(
      classifyDuplicateCandidate(candidate, {
        title: 'Jane  Eyre!',
        author: 'Charlotte Bronte',
        publishYear: 1847,
      })
    ).toMatchObject({ id: 'book-1', reason: 'same_book' });

    expect(
      classifyDuplicateCandidate(candidate, {
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
        publishYear: 2006,
        isbn13: '9780307594006',
        openLibraryEditionId: 'OL999M',
      })
    ).toBeNull();
  });
});
