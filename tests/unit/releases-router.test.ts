import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({ auth: vi.fn() }));
vi.mock('@/server/db', () => ({ db: {} }));

import { CURRENT_RELEASE_VERSION } from '@/lib/releases';
import { releasesRouter } from '@/server/api/routers/releases';
import {
  createScriptedDatabase,
  createTestCaller,
  sequenceSelect,
} from '../support/router-harness';

describe('release notes router', () => {
  it('returns unseen releases for the authenticated account marker', async () => {
    const database = createScriptedDatabase({
      select: sequenceSelect([[{ lastSeenReleaseVersion: null }]]),
    });

    const result = await createTestCaller(releasesRouter.createCaller, database).unseen();

    expect(result.currentVersion).toBe(CURRENT_RELEASE_VERSION);
    expect(result.releases.map(({ version }) => version)).toContain(CURRENT_RELEASE_VERSION);
  });

  it('marks only the server-selected current release as seen', async () => {
    let updatedValues: { lastSeenReleaseVersion?: string } | undefined;
    const database = createScriptedDatabase({
      update: vi.fn(() => ({
        set: vi.fn((values: { lastSeenReleaseVersion: string }) => {
          updatedValues = values;
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => [values]),
            })),
          };
        }),
      })),
    });

    await expect(
      createTestCaller(releasesRouter.createCaller, database).markSeen()
    ).resolves.toEqual({
      lastSeenReleaseVersion: CURRENT_RELEASE_VERSION,
    });
    expect(updatedValues).toEqual({ lastSeenReleaseVersion: CURRENT_RELEASE_VERSION });
  });
});
