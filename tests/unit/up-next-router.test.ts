import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { upNextRouter } from '@/server/api/routers/up-next';
import {
  createScriptedDatabase,
  createTestCaller,
  sequenceSelect,
} from '../support/router-harness';

describe('up next router', () => {
  it('rejects a book once five are queued', async () => {
    const database = createScriptedDatabase({
      select: sequenceSelect([[{ status: 'to_read' }], [{ total: 5 }]]),
      insert: vi.fn(),
    });

    await expect(
      createTestCaller(upNextRouter.createCaller, database).add({ bookId: 'book-1' })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'UP_NEXT_FULL',
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('only accepts books waiting to be read', async () => {
    const database = createScriptedDatabase({
      select: sequenceSelect([[{ status: 'reading' }]]),
      insert: vi.fn(),
    });

    await expect(
      createTestCaller(upNextRouter.createCaller, database).add({ bookId: 'book-1' })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'NOT_TO_READ',
    });
  });
});
