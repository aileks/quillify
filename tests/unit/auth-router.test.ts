import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {},
}));

import { authRouter } from '@/server/api/routers/auth';
import { createScriptedDatabase, createTestCaller } from '../support/router-harness';

function createNameUpdateDatabase(savedNames: (string | undefined)[]) {
  return createScriptedDatabase({
    update: vi.fn(() => ({
      set: vi.fn((values: { name?: string }) => {
        savedNames.push(values.name);
        return { where: vi.fn(async () => []) };
      }),
    })),
  });
}

describe('auth router updateName', () => {
  it('rejects a name made only of spaces', async () => {
    const savedNames: (string | undefined)[] = [];
    const caller = createTestCaller(authRouter.createCaller, createNameUpdateDatabase(savedNames));

    await expect(caller.updateName({ name: '   ' })).rejects.toThrow(
      'Name must be at least 2 characters'
    );
    expect(savedNames).toEqual([]);
  });

  it('saves the name without surrounding spaces', async () => {
    const savedNames: (string | undefined)[] = [];
    const caller = createTestCaller(authRouter.createCaller, createNameUpdateDatabase(savedNames));

    await caller.updateName({ name: '  New Name ' });

    expect(savedNames).toEqual(['New Name']);
  });
});
