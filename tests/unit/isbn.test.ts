import { describe, expect, it } from 'vitest';

import { normalizeIsbn } from '@/lib/isbn';

describe('ISBN normalization', () => {
  it('normalizes ISBN-10, ISBN-13, and Goodreads formula values', () => {
    expect(normalizeIsbn('0-14-144114-3')).toEqual({
      isbn10: '0141441143',
      isbn13: '9780141441146',
    });
    expect(normalizeIsbn('9780141441146')).toEqual({
      isbn10: '0141441143',
      isbn13: '9780141441146',
    });
    expect(normalizeIsbn('="9780141441146"')).toEqual({
      isbn10: '0141441143',
      isbn13: '9780141441146',
    });
  });

  it('supports ISBN-10 X check digits and ISBN-13 values without ISBN-10 equivalents', () => {
    expect(normalizeIsbn('080442957X')).toEqual({
      isbn10: '080442957X',
      isbn13: '9780804429573',
    });
    expect(normalizeIsbn('9791234567896')).toEqual({
      isbn10: null,
      isbn13: '9791234567896',
    });
  });

  it('rejects malformed values and invalid check digits', () => {
    expect(normalizeIsbn('9780141441147')).toBeNull();
    expect(normalizeIsbn('not-an-isbn')).toBeNull();
    expect(normalizeIsbn('')).toBeNull();
  });
});
