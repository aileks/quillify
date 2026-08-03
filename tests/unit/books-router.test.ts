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
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const database = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [{ id: 'user-1', emailVerifiedAt: new Date() }]),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          insertedValues = values;
          return {
            returning: vi.fn(async () => [createdBook]),
          };
        }),
      })),
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
    });

    expect(insertedValues).toMatchObject({
      coverSource: 'open_library',
      coverSourceId: '8235363',
    });
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
      isRead: false,
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
