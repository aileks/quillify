import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  GOODREADS_MAX_FILE_BYTES,
  mapGoodreadsBinding,
  mapGoodreadsShelf,
  normalizeGoodreadsDate,
  parseGoodreadsBookshelves,
  parseGoodreadsCsv,
} from '@/server/services/goodreads-import';

const headers = [
  'Book Id',
  'Title',
  'Author',
  'ISBN',
  'ISBN13',
  'Binding',
  'Number of Pages',
  'Year Published',
  'Original Publication Year',
  'Date Read',
  'Exclusive Shelf',
  'Owned Copies',
].join(',');

describe('Goodreads CSV parsing', () => {
  it('handles a BOM, quoted commas, and formula-wrapped ISBNs', () => {
    const csv = `\uFEFF${headers}\n42,"Pride, Prejudice and Zombies",Seth Grahame-Smith,,="9781594743344",Paperback,320,2009,,2024/01/09,read,1`;

    expect(parseGoodreadsCsv(csv)).toEqual([
      expect.objectContaining({
        sourceRecordId: '42',
        title: 'Pride, Prejudice and Zombies',
        isbn10: '1594743347',
        isbn13: '9781594743344',
        numberOfPages: 320,
        publishYear: 2009,
        readingStatus: 'finished',
        readingFormat: 'print',
        endedOn: '2024-01-09',
        ownershipType: 'owned',
        previewStatus: 'ready',
      }),
    ]);
  });

  it('collects user shelves from the Bookshelves column as tags', () => {
    const csv = `${headers},Bookshelves\n7,Book,Author,,,Paperback,200,2020,,,read,1,"to-read, favorites, owned"`;

    const [row] = parseGoodreadsCsv(csv);
    expect(row?.tags).toEqual(['favorites', 'owned']);
  });

  it('marks missing Quillify fields for correction and rejects unsupported shelves', () => {
    const attention = parseGoodreadsCsv(`${headers}\n1,Book,Author,,,ebook,,,,,to-read,0`)[0];
    const invalid = parseGoodreadsCsv(
      `${headers}\n2,Book,Author,,,hardcover,200,2020,,,favorites,0`
    )[0];

    expect(attention).toMatchObject({
      previewStatus: 'needs_attention',
      issues: ['Enter a page count', 'Enter a publication year'],
    });
    expect(invalid).toMatchObject({ previewStatus: 'invalid' });
    expect(invalid?.issues).toContain('Unsupported shelf');
  });

  it('requires the identifying Goodreads headers and enforces the upload limit', () => {
    expect(() => parseGoodreadsCsv('Title,Author\nBook,Author')).toThrow(
      'Missing Goodreads headers'
    );
    expect(() => parseGoodreadsCsv('x'.repeat(GOODREADS_MAX_FILE_BYTES + 1))).toThrow(
      '5 MiB or smaller'
    );
  });

  it('limits imports to 10,000 records', () => {
    const records = Array.from(
      { length: 10_001 },
      (_, index) => `${index},Book ${index},Author,,,paperback,100,2020,,,to-read,0`
    );
    expect(() => parseGoodreadsCsv([headers, ...records].join('\n'))).toThrow(
      'more than 10000 books'
    );
  });
});

describe('Goodreads field mapping', () => {
  it('maps shelves, bindings, and valid dates', () => {
    expect(mapGoodreadsShelf('currently-reading')).toBe('reading');
    expect(mapGoodreadsShelf('to-read')).toBe('to_read');
    expect(mapGoodreadsBinding('Kindle Edition')).toBe('ebook');
    expect(mapGoodreadsBinding('Audio CD')).toBe('audiobook');
    expect(normalizeGoodreadsDate('2025/02/28')).toBe('2025-02-28');
    expect(normalizeGoodreadsDate('2025/02/30')).toBeNull();
  });

  it('turns user shelves into tags and keeps exclusive shelves out', () => {
    expect(parseGoodreadsBookshelves('to-read, favorites, book-club')).toEqual([
      'favorites',
      'book-club',
    ]);
    expect(parseGoodreadsBookshelves(' read , currently-reading , to-read ')).toEqual([]);
    expect(parseGoodreadsBookshelves('favorites, favorites,')).toEqual(['favorites']);
    expect(parseGoodreadsBookshelves('')).toEqual([]);
  });
});
