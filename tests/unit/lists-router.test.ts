import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { listsRouter } from '@/server/api/routers/lists';
import {
  createScriptedDatabase,
  createTestCaller,
  sequenceSelect,
} from '../support/router-harness';

type ListEntry = { id: string; listId: string; bookId: string; position: number };

const ownedList = { id: 'list-1', userId: 'user-1', name: 'Book club picks' };
const entries: ListEntry[] = [
  { id: 'entry-1', listId: 'list-1', bookId: 'book-1', position: 1 },
  { id: 'entry-2', listId: 'list-1', bookId: 'book-2', position: 2 },
];

describe('lists router reordering', () => {
  it('moves an entry down by swapping positions', async () => {
    const positionUpdates: Partial<ListEntry>[] = [];
    const database = createScriptedDatabase({
      select: sequenceSelect([() => [ownedList], () => entries]),
      update: vi.fn(() => ({
        set: vi.fn((values: Partial<ListEntry>) => {
          positionUpdates.push(values);
          return { where: vi.fn(async () => []) };
        }),
      })),
    });

    await createTestCaller(listsRouter.createCaller, database).moveEntry({
      id: 'list-1',
      entryId: 'entry-1',
      direction: 'down',
    });

    expect(positionUpdates).toEqual([{ position: -1 }, { position: 1 }, { position: 2 }]);
  });

  it('leaves the first entry untouched when moving up', async () => {
    const database = createScriptedDatabase({
      select: sequenceSelect([() => [ownedList], () => entries]),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => []) })),
      })),
    });

    await createTestCaller(listsRouter.createCaller, database).moveEntry({
      id: 'list-1',
      entryId: 'entry-1',
      direction: 'up',
    });

    expect(database.update).not.toHaveBeenCalled();
  });
});
