import { describe, expect, it } from 'vitest';

import {
  BOOK_MAX_PAGE_COUNT,
  bookFormSchema,
  bookInputSchema,
  getMaximumPublishYear,
  toBookInput,
} from '@/lib/book-validation';

describe('book validation', () => {
  it('uses the same accepted boundaries for forms and API input', () => {
    const formValues = {
      title: '  Jane Eyre  ',
      author: '  Charlotte Brontë  ',
      numberOfPages: String(BOOK_MAX_PAGE_COUNT),
      publishYear: String(getMaximumPublishYear()),
      genre: '',
    };

    expect(bookFormSchema.safeParse(formValues).success).toBe(true);
    expect(toBookInput(formValues)).toEqual({
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: BOOK_MAX_PAGE_COUNT,
      publishYear: getMaximumPublishYear(),
      genre: 'Other',
    });
  });

  it('rejects invalid pages and publication years at both boundaries', () => {
    expect(
      bookFormSchema.safeParse({
        title: 'A book',
        author: 'An author',
        numberOfPages: '0',
        publishYear: '999',
        genre: 'Other',
      }).success
    ).toBe(false);

    expect(
      bookInputSchema.safeParse({
        title: 'A book',
        author: 'An author',
        numberOfPages: 0,
        publishYear: 999,
        genre: 'Other',
      }).success
    ).toBe(false);
  });
});
