import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/server/auth', () => ({ auth: vi.fn() }));
vi.mock('@/server/db', () => ({ db: {} }));

import { dataTransferRouter } from '@/server/api/routers/data-transfer';
import {
  createScriptedDatabase,
  createTestCaller,
  sequenceSelect,
  type ScriptedDatabase,
} from '../support/router-harness';

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
  tags: [],
  importAsSeparateEdition: false,
};

describe('Goodreads import router', () => {
  it('skips source IDs already imported by the current user', async () => {
    const database = createScriptedDatabase({
      select: sequenceSelect([
        [{ sourceRecordId: importRow.sourceRecordId }],
        [],
        [{ id: 'user-1', emailVerifiedAt: new Date() }],
      ]),
      insert: vi.fn(),
    });

    await expect(
      createTestCaller(dataTransferRouter.createCaller, database).importGoodreads({
        rows: [importRow],
      })
    ).resolves.toEqual({
      created: 0,
      skipped: 1,
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('enforces the unverified account capacity before any writes', async () => {
    const database = createScriptedDatabase({
      select: sequenceSelect([[], [], [{ id: 'user-1', emailVerifiedAt: null }], [{ count: 10 }]]),
      insert: vi.fn(),
    });

    await expect(
      createTestCaller(dataTransferRouter.createCaller, database).importGoodreads({
        rows: [importRow],
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'BOOK_LIMIT_REACHED',
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('keeps book, reading period, and provenance writes in one transaction', async () => {
    let didRollBack = false;
    let insertIndex = 0;
    const database = createScriptedDatabase({
      select: sequenceSelect([[], [], [{ id: 'user-1', emailVerifiedAt: new Date() }]]),
      insert: vi.fn(() => ({
        values: vi.fn(async () => {
          insertIndex += 1;
          if (insertIndex === 2) throw new Error('period write failed');
        }),
      })),
      transaction: (scriptedDatabase) =>
        vi.fn(async (runInTransaction: (tx: ScriptedDatabase) => Promise<object>) => {
          try {
            return await runInTransaction(scriptedDatabase);
          } catch (error) {
            didRollBack = true;
            throw error;
          }
        }),
    });

    await expect(
      createTestCaller(dataTransferRouter.createCaller, database).importGoodreads({
        rows: [importRow],
      })
    ).rejects.toThrow('period write failed');
    expect(didRollBack).toBe(true);
    expect(database.transaction).toHaveBeenCalledOnce();
  });
});
