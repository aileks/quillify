import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { booksRouter } from '@/server/api/routers/books';
import {
  createScriptedDatabase,
  createTestCaller,
  sequenceSelect,
} from '../support/router-harness';

describe('books router cover persistence', () => {
  it('returns likely matches without writing until a separate edition is confirmed', async () => {
    const existingBook = {
      id: 'book-existing',
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      publishYear: 1847,
      coverSourceId: '8235363',
      isbn13: '9780141441146',
      openLibraryEditionId: 'OL22731948M',
    };
    const database = createScriptedDatabase({
      select: sequenceSelect([[existingBook]]),
      insert: vi.fn(),
    });

    const result = await createTestCaller(booksRouter.createCaller, database).create({
      duplicateAction: 'review',
      book: {
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
        numberOfPages: 532,
        genre: 'Classics',
        publishYear: 1847,
        isbn13: '9780141441146',
        ownershipType: 'unknown',
      },
    });

    expect(result).toEqual({
      status: 'duplicate_warning',
      matches: [{ ...existingBook, reason: 'same_edition' }],
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('creates a book with its selected cover', async () => {
    const createdBook = {
      id: 'book-1',
      userId: 'user-1',
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: 532,
      genre: 'Classics',
      publishYear: 1847,
      coverSource: 'open_library',
      coverSourceId: '8235363',
      isbn10: '0141441143',
      isbn13: '9780141441146',
      openLibraryWorkId: 'OL123W',
      openLibraryEditionId: 'OL456M',
      ownershipType: 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const currentReadingPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'to_read',
      format: null,
      startedOn: null,
      endedOn: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const insertedRows: Array<typeof createdBook | typeof currentReadingPeriod> = [];
    let insertCount = 0;
    const database = createScriptedDatabase({
      select: sequenceSelect([[{ id: 'user-1', emailVerifiedAt: new Date() }]]),
      insert: vi.fn(() => {
        insertCount += 1;
        return {
          values: vi.fn((values: typeof createdBook | typeof currentReadingPeriod) => {
            insertedRows.push(values);
            const returned = insertCount === 1 ? createdBook : currentReadingPeriod;
            return {
              returning: vi.fn(async () => [returned]),
            };
          }),
        };
      }),
    });

    await createTestCaller(booksRouter.createCaller, database).create({
      duplicateAction: 'create_separate_edition',
      book: {
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
        numberOfPages: 532,
        genre: 'Classics',
        publishYear: 1847,
        coverSource: 'open_library',
        coverSourceId: '8235363',
        isbn10: '0141441143',
        isbn13: '9780141441146',
        openLibraryWorkId: 'OL123W',
        openLibraryEditionId: 'OL456M',
        ownershipType: 'unknown',
      },
    });

    expect(insertedRows[0]).toMatchObject({
      coverSource: 'open_library',
      coverSourceId: '8235363',
      ownershipType: 'unknown',
      isbn10: '0141441143',
      isbn13: '9780141441146',
      openLibraryWorkId: 'OL123W',
      openLibraryEditionId: 'OL456M',
    });
    expect(insertedRows[1]).toMatchObject({ bookId: 'book-1', status: 'to_read' });
  });

  it('updates a book with an explicitly selected cover', async () => {
    let updatedValues: { coverSource?: string | null; coverSourceId?: string | null } | undefined;
    const existingBook = {
      id: 'book-1',
      userId: 'user-1',
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: 532,
      genre: 'Classics',
      publishYear: 1847,
      coverSource: null,
      coverSourceId: null,
      ownershipType: 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'to_read' as const,
      format: null,
      startedOn: null,
      endedOn: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const database = createScriptedDatabase({
      select: sequenceSelect([
        () => [existingBook],
        () => [existingBook],
        () => [currentPeriod],
        () => [],
      ]),
      update: vi.fn(() => ({
        set: vi.fn((values: { coverSource?: string | null; coverSourceId?: string | null }) => {
          updatedValues = values;
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => [
                {
                  ...existingBook,
                  ...values,
                },
              ]),
            })),
          };
        }),
      })),
    });

    await createTestCaller(booksRouter.createCaller, database).update({
      id: 'book-1',
      coverSource: 'open_library',
      coverSourceId: '8235363',
    });

    expect(updatedValues).toMatchObject({
      coverSource: 'open_library',
      coverSourceId: '8235363',
    });
  });
});

describe('books router reading lifecycle', () => {
  const book = {
    id: 'book-1',
    userId: 'user-1',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    numberOfPages: 532,
    genre: 'Classics',
    publishYear: 1847,
    coverSource: null,
    coverSourceId: null,
    ownershipType: 'owned',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('allows any status while updating an active period in place', async () => {
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'to_read' as const,
      format: 'print' as const,
      startedOn: null,
      endedOn: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let savedPeriod = currentPeriod;
    let updatedValues: Partial<typeof currentPeriod> | undefined;
    const database = createScriptedDatabase({
      select: sequenceSelect([
        () => [book],
        () => [savedPeriod],
        () => [],
        () => [book],
        () => [savedPeriod],
        () => [],
      ]),
      update: vi.fn(() => ({
        set: vi.fn((values: Partial<typeof currentPeriod>) => {
          updatedValues = values;
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => {
                savedPeriod = { ...currentPeriod, ...values };
                return [savedPeriod];
              }),
            })),
          };
        }),
      })),
    });

    const result = await createTestCaller(booksRouter.createCaller, database).transitionStatus({
      bookId: 'book-1',
      status: 'paused',
      format: 'print',
      startedOn: null,
      endedOn: null,
    });

    expect(updatedValues).toMatchObject({ status: 'paused', startedOn: null });
    expect(result.currentReadingPeriod.status).toBe('paused');
  });

  it('updates book metadata and its current period in one transaction', async () => {
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'to_read' as const,
      format: null,
      startedOn: null,
      endedOn: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let savedBook = book;
    let savedPeriod = currentPeriod;
    const updatedValues: Array<Partial<typeof book> | Partial<typeof currentPeriod>> = [];
    const database = createScriptedDatabase({
      select: sequenceSelect([
        () => [savedBook],
        () => [savedPeriod],
        () => [],
        () => [savedBook],
        () => [savedPeriod],
        () => [],
      ]),
      update: vi.fn(() => ({
        set: vi.fn((values: Partial<typeof book> | Partial<typeof currentPeriod>) => {
          updatedValues.push(values);
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => {
                if (updatedValues.length === 1) {
                  savedBook = { ...book, ...values };
                  return [savedBook];
                }

                savedPeriod = { ...currentPeriod, ...values };
                return [savedPeriod];
              }),
            })),
          };
        }),
      })),
    });

    await createTestCaller(booksRouter.createCaller, database).update({
      id: 'book-1',
      ownershipType: 'library',
      readingDetails: {
        status: 'paused',
        format: 'ebook',
        startedOn: '2026-08-01',
        endedOn: null,
      },
    });

    expect(database.transaction).toHaveBeenCalledOnce();
    expect(updatedValues[0]).toMatchObject({ ownershipType: 'library' });
    expect(updatedValues[1]).toMatchObject({
      status: 'paused',
      format: 'ebook',
      startedOn: '2026-08-01',
    });
  });

  it('creates a new current period for a reread', async () => {
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'finished' as const,
      format: 'print' as const,
      startedOn: '2026-07-01',
      endedOn: '2026-07-20',
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newPeriod = {
      ...currentPeriod,
      id: 'period-2',
      status: 'reading' as const,
      startedOn: '2026-08-11',
      endedOn: null,
    };
    let insertedValues: Partial<typeof newPeriod> | undefined;
    const database = createScriptedDatabase({
      select: sequenceSelect([
        () => [book],
        () => [currentPeriod],
        () => [],
        () => [book],
        () => [{ ...currentPeriod, isCurrent: false }, newPeriod],
        () => [],
      ]),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => []) })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Partial<typeof newPeriod>) => {
          insertedValues = values;
          return { returning: vi.fn(async () => [newPeriod]) };
        }),
      })),
    });

    const result = await createTestCaller(booksRouter.createCaller, database).transitionStatus({
      bookId: 'book-1',
      status: 'reading',
      format: 'ebook',
      startedOn: '2026-08-11',
      endedOn: null,
    });

    expect(insertedValues).toMatchObject({
      bookId: 'book-1',
      status: 'reading',
      format: 'ebook',
    });
    expect(result.currentReadingPeriod.id).toBe('period-2');
  });

  it('corrects a terminal outcome without creating a new period', async () => {
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'finished' as const,
      format: 'print' as const,
      startedOn: '2026-07-01',
      endedOn: '2026-07-20',
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let savedPeriod = currentPeriod;
    let updatedValues: Partial<typeof currentPeriod> | undefined;
    const database = createScriptedDatabase({
      select: sequenceSelect([
        () => [book],
        () => [savedPeriod],
        () => [],
        () => [book],
        () => [savedPeriod],
        () => [],
      ]),
      update: vi.fn(() => ({
        set: vi.fn((values: Partial<typeof currentPeriod>) => {
          updatedValues = values;
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => {
                savedPeriod = { ...currentPeriod, ...values };
                return [savedPeriod];
              }),
            })),
          };
        }),
      })),
      insert: vi.fn(),
    });

    const result = await createTestCaller(booksRouter.createCaller, database).transitionStatus({
      bookId: 'book-1',
      status: 'did_not_finish',
      format: 'print',
      startedOn: '2026-07-01',
      endedOn: '2026-07-20',
    });

    expect(updatedValues).toMatchObject({ status: 'did_not_finish' });
    expect(database.insert).not.toHaveBeenCalled();
    expect(result.currentReadingPeriod.status).toBe('did_not_finish');
  });

  it('removes a departing book from Up Next', async () => {
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'to_read' as const,
      format: null,
      startedOn: null,
      endedOn: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const database = createScriptedDatabase({
      select: sequenceSelect([
        () => [book],
        () => [currentPeriod],
        () => [{ userId: 'user-1' }],
        () => [],
        () => [book],
        () => [currentPeriod],
        () => [],
      ]),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({ returning: vi.fn(async () => [currentPeriod]) })),
        })),
      })),
      delete: vi.fn(() => ({ where: vi.fn(async () => []) })),
    });

    await createTestCaller(booksRouter.createCaller, database).transitionStatus({
      bookId: 'book-1',
      status: 'reading',
      format: null,
      startedOn: null,
      endedOn: null,
    });

    expect(database.delete).toHaveBeenCalledOnce();
  });
});
