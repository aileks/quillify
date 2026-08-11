import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { booksRouter } from '@/server/api/routers/books';

type BooksRouterContext = Parameters<typeof booksRouter.createCaller>[0];

function createSession() {
  return {
    user: {
      id: 'user-1',
      email: 'reader@example.com',
      emailVerified: true,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe('books router cover persistence', () => {
  it('creates a book with its selected cover', async () => {
    let insertedValues: Record<string, unknown> | undefined;
    let insertedPeriodValues: Record<string, unknown> | undefined;
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
    let insertCount = 0;
    const database = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [{ id: 'user-1', emailVerifiedAt: new Date() }]),
        })),
      })),
      insert: vi.fn(() => {
        insertCount += 1;
        return {
          values: vi.fn((values: Record<string, unknown>) => {
            if (insertCount === 1) {
              insertedValues = values;
            } else {
              insertedPeriodValues = values;
            }
            const returned = insertCount === 1 ? createdBook : currentReadingPeriod;
            return {
              returning: vi.fn(async () => [returned]),
            };
          }),
        };
      }),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };
    const caller = booksRouter.createCaller({
      db: database,
      session: createSession(),
      headers: new Headers(),
    } as unknown as BooksRouterContext);

    await caller.create({
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      numberOfPages: 532,
      genre: 'Classics',
      publishYear: 1847,
      coverSource: 'open_library',
      coverSourceId: '8235363',
      ownershipType: 'unknown',
    });

    expect(insertedValues).toMatchObject({
      coverSource: 'open_library',
      coverSourceId: '8235363',
      ownershipType: 'unknown',
    });
    expect(insertedPeriodValues).toMatchObject({ bookId: 'book-1', status: 'to_read' });
  });

  it('updates a book with an explicitly selected cover', async () => {
    let updatedValues: Record<string, unknown> | undefined;
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
    const database = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [existingBook]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
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
    };
    const caller = booksRouter.createCaller({
      db: database,
      session: createSession(),
      headers: new Headers(),
    } as unknown as BooksRouterContext);

    await caller.update({
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

  it('updates the current period for an active transition', async () => {
    const currentPeriod = {
      id: 'period-1',
      bookId: 'book-1',
      status: 'reading' as const,
      format: 'print' as const,
      startedOn: '2026-08-01',
      endedOn: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let selectCount = 0;
    let updatedValues: Record<string, unknown> | undefined;
    const database = {
      select: vi.fn(() => {
        selectCount += 1;
        return {
          from: vi.fn(() => ({
            where: vi.fn(async () => (selectCount === 1 ? [book] : [currentPeriod])),
          })),
        };
      }),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          updatedValues = values;
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => [{ ...currentPeriod, ...values }]),
            })),
          };
        }),
      })),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };
    const caller = booksRouter.createCaller({
      db: database,
      session: createSession(),
      headers: new Headers(),
    } as unknown as BooksRouterContext);

    const result = await caller.transitionStatus({
      bookId: 'book-1',
      status: 'paused',
      format: 'print',
      startedOn: '2026-08-01',
      endedOn: null,
    });

    expect(updatedValues).toMatchObject({ status: 'paused', startedOn: '2026-08-01' });
    expect(result.currentReadingPeriod.status).toBe('paused');
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
    let selectCount = 0;
    let insertedValues: Record<string, unknown> | undefined;
    const database = {
      select: vi.fn(() => {
        selectCount += 1;
        return {
          from: vi.fn(() => ({
            where: vi.fn(async () => (selectCount === 1 ? [book] : [currentPeriod])),
          })),
        };
      }),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => []) })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          insertedValues = values;
          return { returning: vi.fn(async () => [newPeriod]) };
        }),
      })),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };
    const caller = booksRouter.createCaller({
      db: database,
      session: createSession(),
      headers: new Headers(),
    } as unknown as BooksRouterContext);

    const result = await caller.transitionStatus({
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
});
