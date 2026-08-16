import { describe, expect, it } from 'vitest';

import { createLibraryBackup } from '@/server/services/library-export';

describe('library backup', () => {
  it('creates a versioned document with organization, catalog identity, and no credentials', () => {
    const timestamp = new Date('2026-08-12T15:00:00.000Z');
    const accountWithPassword = {
      id: 'user-1',
      name: 'Reader',
      email: 'reader@example.com',
      createdAt: timestamp,
      updatedAt: timestamp,
      password: 'must-not-leak',
    };
    const backup = createLibraryBackup({
      account: accountWithPassword,
      books: [
        {
          id: 'book-1',
          title: 'Jane Eyre',
          author: 'Charlotte Brontë',
          numberOfPages: 532,
          genre: 'Classics',
          publishYear: 1847,
          coverSource: 'open_library',
          coverSourceId: '8235363',
          isbn10: '0141441143',
          isbn13: '9780141441146',
          openLibraryWorkId: 'OL1095427W',
          openLibraryEditionId: 'OL22731948M',
          ownershipType: 'owned',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'book-2',
          title: 'Dracula',
          author: 'Bram Stoker',
          numberOfPages: 418,
          genre: 'Gothic',
          publishYear: 1897,
          coverSource: null,
          coverSourceId: null,
          isbn10: null,
          isbn13: null,
          openLibraryWorkId: null,
          openLibraryEditionId: null,
          ownershipType: 'unknown',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      readingPeriods: [
        {
          id: 'period-1',
          bookId: 'book-1',
          status: 'finished',
          format: 'print',
          startedOn: '2026-01-01',
          endedOn: '2026-01-12',
          isCurrent: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      importSources: [
        {
          bookId: 'book-1',
          source: 'goodreads',
          sourceRecordId: '42',
          createdAt: timestamp,
        },
      ],
      bookTags: [
        { bookId: 'book-2', name: 'gothic' },
        { bookId: 'book-1', name: 'book-club' },
        { bookId: 'book-1', name: 'favorites' },
      ],
      lists: [
        {
          id: 'list-1',
          name: 'Book club picks',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      listEntries: [
        { listId: 'list-1', bookId: 'book-2', position: 2 },
        { listId: 'list-1', bookId: 'book-1', position: 1 },
      ],
      upNextEntries: [
        { bookId: 'book-2', position: 2 },
        { bookId: 'book-1', position: 1 },
      ],
      exportedAt: timestamp,
    });
    const serialized = JSON.stringify(backup);

    expect(backup).toMatchObject({
      format: 'quillify-backup',
      schemaVersion: 2,
      exportedAt: timestamp.toISOString(),
      books: [
        {
          isbn13: '9780141441146',
          openLibraryEditionId: 'OL22731948M',
          tags: ['book-club', 'favorites'],
          readingPeriods: [{ id: 'period-1' }],
          importSources: [{ source: 'goodreads', sourceRecordId: '42' }],
        },
        {
          id: 'book-2',
          tags: ['gothic'],
        },
      ],
      lists: [{ id: 'list-1', name: 'Book club picks', bookIds: ['book-1', 'book-2'] }],
      upNext: ['book-1', 'book-2'],
    });
    expect(serialized).not.toContain('must-not-leak');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('token');
  });
});
