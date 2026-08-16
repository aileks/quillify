import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  compareSemanticVersions,
  CURRENT_RELEASE_VERSION,
  getReleaseNotesPreview,
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
    expect(getUnseenReleases('2.0.0').map(({ version }) => version)).toEqual([
      '2.2.1',
      '2.2.0',
      '2.1.1',
    ]);
  });

  it('previews cumulative notes for a simulated seen version in development only', () => {
    expect(getReleaseNotesPreview('1', 'development')).toEqual(RELEASE_MANIFEST);
    expect(getReleaseNotesPreview('2.0.0', 'development')).toEqual(RELEASE_MANIFEST);
    expect(getReleaseNotesPreview('2.1.1', 'development')).toEqual(
      RELEASE_MANIFEST.filter(({ version }) => version !== '2.1.1')
    );
    expect(getReleaseNotesPreview('2.2.0', 'development')).toEqual([RELEASE_MANIFEST[0]]);
    expect(getReleaseNotesPreview(CURRENT_RELEASE_VERSION, 'development')).toEqual([]);
    expect(getReleaseNotesPreview('1', 'production')).toBeNull();
    expect(getReleaseNotesPreview(null, 'development')).toBeNull();
    expect(getReleaseNotesPreview('yesterday', 'development')).toBeNull();
  });

  it('matches the package version to the newest release', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    ) as { version: string };
    expect(packageJson.version).toBe(CURRENT_RELEASE_VERSION);
  });
});
