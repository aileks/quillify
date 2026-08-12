import { describe, expect, it } from 'vitest';

import { createLibraryBackup } from '@/server/services/library-export';

describe('library backup', () => {
  it('creates a versioned document with catalog identity and no credentials', () => {
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
      exportedAt: timestamp,
    });
    const serialized = JSON.stringify(backup);

    expect(backup).toMatchObject({
      format: 'quillify-backup',
      schemaVersion: 1,
      exportedAt: timestamp.toISOString(),
      books: [
        {
          isbn13: '9780141441146',
          openLibraryEditionId: 'OL22731948M',
          readingPeriods: [{ id: 'period-1' }],
          importSources: [{ source: 'goodreads', sourceRecordId: '42' }],
        },
      ],
    });
    expect(serialized).not.toContain('must-not-leak');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('token');
  });
});
