import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({ auth: vi.fn() }));
vi.mock('@/server/db', () => ({ db: {} }));

import { CURRENT_RELEASE_VERSION } from '@/lib/releases';
import { releasesRouter } from '@/server/api/routers/releases';

type ReleasesRouterContext = Parameters<typeof releasesRouter.createCaller>[0];

function createCaller(database: object) {
  return releasesRouter.createCaller({
    db: database,
    session: {
      user: { id: 'user-1', email: 'reader@example.com', emailVerified: true },
      expires: new Date(Date.now() + 60_000).toISOString(),
    },
    headers: new Headers(),
  } as unknown as ReleasesRouterContext);
}

describe('release notes router', () => {
  it('returns unseen releases for the authenticated account marker', async () => {
    const database = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [{ lastSeenReleaseVersion: null }]),
        })),
      })),
    };

    const result = await createCaller(database).unseen();

    expect(result.currentVersion).toBe(CURRENT_RELEASE_VERSION);
    expect(result.releases.map(({ version }) => version)).toContain(CURRENT_RELEASE_VERSION);
  });

  it('marks only the server-selected current release as seen', async () => {
    let updatedValues: Record<string, unknown> | undefined;
    const database = {
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          updatedValues = values;
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => [values]),
            })),
          };
        }),
      })),
    };

    await expect(createCaller(database).markSeen()).resolves.toEqual({
      lastSeenReleaseVersion: CURRENT_RELEASE_VERSION,
    });
    expect(updatedValues).toEqual({ lastSeenReleaseVersion: CURRENT_RELEASE_VERSION });
  });
});
