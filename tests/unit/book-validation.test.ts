import { describe, expect, it } from 'vitest';

import {
  BOOK_MAX_PAGE_COUNT,
  bookFormSchema,
  bookInputSchema,
  bookMetadataUpdateInputSchema,
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
      isbn: '9780141441146',
      catalogIsbns: ['9780141441146'],
      openLibraryWorkId: 'OL123W',
      openLibraryEditionId: 'OL456M',
      ownershipType: 'unknown' as const,
      tags: [],
      includeReadingDetails: false,
      readingStatus: 'to_read' as const,
      readingFormat: '' as const,
      startedOn: '',
      endedOn: '',
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
      isbn10: '0141441143',
      isbn13: '9780141441146',
      openLibraryWorkId: 'OL123W',
      openLibraryEditionId: 'OL456M',
      ownershipType: 'unknown',
      tags: [],
      readingDetails: undefined,
    });
  });

  it('clears edition identity when the selected ISBN changes', () => {
    const result = toBookInput({
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: '532',
      publishYear: '1847',
      genre: 'Classics',
      coverSource: null,
      coverSourceId: null,
      isbn: '9780307594006',
      catalogIsbns: ['9780141441146'],
      openLibraryWorkId: 'OL123W',
      openLibraryEditionId: 'OL456M',
      ownershipType: 'unknown',
      tags: [],
      includeReadingDetails: false,
      readingStatus: 'to_read',
      readingFormat: '',
      startedOn: '',
      endedOn: '',
    });

    expect(result.openLibraryWorkId).toBe('OL123W');
    expect(result.openLibraryEditionId).toBeNull();
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

  it('accepts current reading details with a book update', () => {
    expect(
      bookMetadataUpdateInputSchema.parse({
        id: 'book-id',
        ownershipType: 'library',
        readingDetails: {
          status: 'paused',
          format: 'ebook',
          startedOn: '2026-08-01',
          endedOn: null,
        },
      })
    ).toEqual({
      id: 'book-id',
      ownershipType: 'library',
      readingDetails: {
        status: 'paused',
        format: 'ebook',
        startedOn: '2026-08-01',
        endedOn: null,
      },
    });
  });
});
