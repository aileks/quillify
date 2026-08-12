import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  compareSemanticVersions,
  CURRENT_RELEASE_VERSION,
  getUnseenReleases,
  RELEASE_MANIFEST,
} from '@/lib/releases';

describe('release manifest', () => {
  it('is ordered newest first using semantic versions', () => {
    for (let index = 1; index < RELEASE_MANIFEST.length; index += 1) {
      expect(
        compareSemanticVersions(
          RELEASE_MANIFEST[index - 1]!.version,
          RELEASE_MANIFEST[index]!.version
        )
      ).toBeGreaterThan(0);
    }
    expect(compareSemanticVersions('2.10.0', '2.9.9')).toBeGreaterThan(0);
  });

  it('returns every release newer than the account marker', () => {
    expect(getUnseenReleases(null)).toEqual(RELEASE_MANIFEST);
    expect(getUnseenReleases(CURRENT_RELEASE_VERSION)).toEqual([]);
  });

  it('matches the package version to the newest release', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    ) as { version: string };
    expect(packageJson.version).toBe(CURRENT_RELEASE_VERSION);
  });
});
