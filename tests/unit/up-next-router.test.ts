import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { upNextRouter } from '@/server/api/routers/up-next';

type UpNextRouterContext = Parameters<typeof upNextRouter.createCaller>[0];

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
  return upNextRouter.createCaller({
    db: database,
    session: createSession(),
    headers: new Headers(),
  } as unknown as UpNextRouterContext);
}

describe('up next router', () => {
  it('rejects a book once five are queued', async () => {
    const database = {
      select: sequenceSelect([[{ status: 'to_read' }], [{ total: 5 }]]),
      insert: vi.fn(),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };

    await expect(createCaller(database).add({ bookId: 'book-1' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'UP_NEXT_FULL',
    });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it('only accepts books waiting to be read', async () => {
    const database = {
      select: sequenceSelect([[{ status: 'reading' }]]),
      insert: vi.fn(),
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(database)),
    };

    await expect(createCaller(database).add({ bookId: 'book-1' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'NOT_TO_READ',
    });
  });
});
