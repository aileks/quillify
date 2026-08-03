import { describe, expect, it } from 'vitest';

import {
  BOOK_MAX_PAGE_COUNT,
  bookFormSchema,
  bookInputSchema,
  bookUpdateInputSchema,
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
      coverSource: null,
      coverSourceId: null,
    };

    expect(bookFormSchema.safeParse(formValues).success).toBe(true);
    expect(toBookInput(formValues)).toEqual({
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: BOOK_MAX_PAGE_COUNT,
      publishYear: getMaximumPublishYear(),
      genre: 'Other',
      coverSource: null,
      coverSourceId: null,
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

  it('accepts create and edit input with a selected Open Library cover', () => {
    const createInput = {
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: 532,
      publishYear: 1847,
      genre: 'Classics',
      coverSource: 'open_library' as const,
      coverSourceId: '8235363',
    };

    expect(bookInputSchema.parse(createInput)).toEqual(createInput);
    expect(
      bookUpdateInputSchema.parse({
        id: 'book-id',
        coverSource: 'open_library',
        coverSourceId: '8235363',
      })
    ).toEqual({
      id: 'book-id',
      coverSource: 'open_library',
      coverSourceId: '8235363',
    });
  });

  it('accepts omitted cover fields and rejects incomplete cover selections', () => {
    expect(
      bookInputSchema.safeParse({
        title: 'A book',
        author: 'An author',
        numberOfPages: 200,
        publishYear: 2020,
      }).success
    ).toBe(true);

    expect(
      bookInputSchema.safeParse({
        title: 'A book',
        author: 'An author',
        numberOfPages: 200,
        publishYear: 2020,
        coverSource: 'open_library',
        coverSourceId: null,
      }).success
    ).toBe(false);

    expect(
      bookUpdateInputSchema.safeParse({
        id: 'book-id',
        coverSourceId: '8235363',
      }).success
    ).toBe(false);
  });
});
