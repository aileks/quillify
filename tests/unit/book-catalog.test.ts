import { describe, expect, it } from 'vitest';

import { catalogResultToBookFormValues } from '@/lib/book-catalog';

describe('catalog book form mapping', () => {
  it('prefills available edition metadata', () => {
    expect(
      catalogResultToBookFormValues({
        openLibraryId: 'OL456M',
        coverId: '222',
        title: 'Jane Eyre',
        authors: ['Charlotte Brontë', 'Michael Mason'],
        firstPublicationYear: 1847,
        editionPublicationYear: 2006,
        numberOfPages: 532,
        isbns: ['9780141441146'],
      })
    ).toEqual({
      title: 'Jane Eyre',
      author: 'Charlotte Brontë, Michael Mason',
      numberOfPages: '532',
      publishYear: '2006',
      genre: '',
      coverSource: 'open_library',
      coverSourceId: '222',
      ownershipType: 'unknown',
      includeReadingDetails: false,
      readingStatus: 'to_read',
      readingFormat: '',
      startedOn: '',
      endedOn: '',
    });
  });

  it('leaves unavailable or invalid required metadata for the reader to complete', () => {
    expect(
      catalogResultToBookFormValues({
        openLibraryId: 'OL123W',
        coverId: null,
        title: 'An Unfinished Catalog Record',
        authors: [],
        firstPublicationYear: 900,
        editionPublicationYear: null,
        numberOfPages: 100_001,
        isbns: [],
      })
    ).toEqual({
      title: 'An Unfinished Catalog Record',
      author: '',
      numberOfPages: '',
      publishYear: '',
      genre: '',
      coverSource: null,
      coverSourceId: null,
      ownershipType: 'unknown',
      includeReadingDetails: false,
      readingStatus: 'to_read',
      readingFormat: '',
      startedOn: '',
      endedOn: '',
    });
  });
});
