import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { listsRouter } from '@/server/api/routers/lists';

type ListsRouterContext = Parameters<typeof listsRouter.createCaller>[0];

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

function queryResult(rows: readonly unknown[]) {
  return Object.assign(Promise.resolve(rows), {
    orderBy: vi.fn(async () => rows),
  });
}

type LazyRows = unknown[] | (() => unknown[]);

interface SelectChain {
  where: () => ReturnType<typeof queryResult>;
  innerJoin: () => SelectChain;
}

function sequenceSelect(results: readonly LazyRows[]) {
  let index = 0;
  return vi.fn(() => {
    const result = results[index] ?? [];
    index += 1;
    const rows = typeof result === 'function' ? result() : result;
    const chain: SelectChain = {
      where: () => queryResult(rows),
      innerJoin: () => chain,
    };
    return { from: () => chain };
  });
}

function createCaller(database: object) {
  return listsRouter.createCaller({
    db: database,
    session: createSession(),
    headers: new Headers(),
  } as unknown as ListsRouterContext);
}

const ownedList = { id: 'list-1', userId: 'user-1', name: 'Book club picks' };
const entries = [
  { id: 'entry-1', listId: 'list-1', bookId: 'book-1', position: 1 },
  { id: 'entry-2', listId: 'list-1', bookId: 'book-2', position: 2 },
];

describe('lists router reordering', () => {
  it('moves an entry down by swapping positions', async () => {
    const positionUpdates: Array<Record<string, unknown>> = [];
    const database = {
      select: sequenceSelect([() => [ownedList], () => entries]),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          positionUpdates.push(values);
          return { where: vi.fn(async () => []) };
        }),
      })),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };

    await createCaller(database).moveEntry({
      id: 'list-1',
      entryId: 'entry-1',
      direction: 'down',
    });

    expect(positionUpdates).toEqual([{ position: -1 }, { position: 1 }, { position: 2 }]);
  });

  it('leaves the first entry untouched when moving up', async () => {
    const database = {
      select: sequenceSelect([() => [ownedList], () => entries]),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => []) })),
      })),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };

    await createCaller(database).moveEntry({ id: 'list-1', entryId: 'entry-1', direction: 'up' });

    expect(database.update).not.toHaveBeenCalled();
  });
});
