import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock('next-auth', () => ({}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((config) => config),
}));

vi.mock('@/server/db', () => ({
  db: {
    query: {
      users: { findFirst },
    },
  },
}));

vi.mock('@/server/api/root', () => ({
  createCaller: vi.fn(),
}));

import { authConfig } from '@/server/auth/config';

describe('auth session updates', () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it('refreshes the name in the JWT after a profile update', async () => {
    findFirst.mockResolvedValue({
      name: 'New Name',
      email: 'reader@example.com',
      emailVerifiedAt: new Date(),
    });

    const token = await authConfig.callbacks.jwt({
      token: {
        id: 'user-1',
        name: 'Old Name',
        email: 'reader@example.com',
      },
      user: { id: 'user-1' },
      trigger: 'update',
      session: null,
    });

    expect(token.name).toBe('New Name');
  });
});
