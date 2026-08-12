import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/server/auth', () => ({ auth: vi.fn() }));
vi.mock('@/server/db', () => ({ db: {} }));

import { dataTransferRouter } from '@/server/api/routers/data-transfer';

type DataTransferRouterContext = Parameters<typeof dataTransferRouter.createCaller>[0];

const importRow = {
  sourceRecordId: 'goodreads-1',
  title: 'Jane Eyre',
  author: 'Charlotte Brontë',
  numberOfPages: 532,
  publishYear: 1847,
  isbn10: '0141441143',
  isbn13: '9780141441146',
  readingStatus: 'finished' as const,
  readingFormat: 'print' as const,
  endedOn: '2025-01-12',
  ownershipType: 'owned' as const,
  importAsSeparateEdition: false,
};

function createCaller(database: object) {
  return dataTransferRouter.createCaller({
    db: database,
    session: {
      user: { id: 'user-1', email: 'reader@example.com', emailVerified: true },
      expires: new Date(Date.now() + 60_000).toISOString(),
    },
    headers: new Headers(),
  } as unknown as DataTransferRouterContext);
}

function createSelectMock(results: unknown[][]) {
  let selectIndex = 0;
  return vi.fn(() => {
    const result = results[selectIndex] ?? [];
    selectIndex += 1;
    return { from: vi.fn(() => ({ where: vi.fn(async () => result) })) };
  });
}

describe('Goodreads import router', () => {
  it('skips source IDs already imported by the current user', async () => {
    const database = {
      select: createSelectMock([
        [{ sourceRecordId: importRow.sourceRecordId }],
        [],
        [{ id: 'user-1', emailVerifiedAt: new Date() }],
      ]),
      insert: vi.fn(),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };

    await expect(createCaller(database).importGoodreads({ rows: [importRow] })).resolves.toEqual({
      created: 0,
      skipped: 1,
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('enforces the unverified account capacity before any writes', async () => {
    const database = {
      select: createSelectMock([
        [],
        [],
        [{ id: 'user-1', emailVerifiedAt: null }],
        [{ count: 10 }],
      ]),
      insert: vi.fn(),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };

    await expect(
      createCaller(database).importGoodreads({ rows: [importRow] })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'BOOK_LIMIT_REACHED',
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('keeps book, reading period, and provenance writes in one transaction', async () => {
    let didRollBack = false;
    let insertIndex = 0;
    const database = {
      select: createSelectMock([[], [], [{ id: 'user-1', emailVerifiedAt: new Date() }]]),
      insert: vi.fn(() => ({
        values: vi.fn(async () => {
          insertIndex += 1;
          if (insertIndex === 2) throw new Error('period write failed');
        }),
      })),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        try {
          return await callback(database);
        } catch (error) {
          didRollBack = true;
          throw error;
        }
      }),
    };

    await expect(createCaller(database).importGoodreads({ rows: [importRow] })).rejects.toThrow(
      'period write failed'
    );
    expect(didRollBack).toBe(true);
    expect(database.transaction).toHaveBeenCalledOnce();
  });
});
