import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

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
    const versionsAfter20 = RELEASE_MANIFEST.filter(
      ({ version }) => compareSemanticVersions(version, '2.0.0') > 0
    ).map(({ version }) => version);

    expect(getUnseenReleases(null)).toEqual(RELEASE_MANIFEST);
    expect(getUnseenReleases(CURRENT_RELEASE_VERSION)).toEqual([]);
    expect(getUnseenReleases('2.0.0').map(({ version }) => version)).not.toContain('2.0.0');
    expect(versionsAfter20.length).toBeGreaterThan(1);
    expect(getUnseenReleases('2.0.0').map(({ version }) => version)).toEqual(versionsAfter20);
  });

  it('previews cumulative notes for a simulated seen version in development only', () => {
    const releasesAfter211 = RELEASE_MANIFEST.filter(
      ({ version }) => compareSemanticVersions(version, '2.1.1') > 0
    );

    expect(getReleaseNotesPreview('1', 'development')).toEqual(RELEASE_MANIFEST);
    expect(getReleaseNotesPreview('2.0.0', 'development')).toEqual(RELEASE_MANIFEST);
    expect(getReleaseNotesPreview('2.1.1', 'development')).toEqual(releasesAfter211);
    expect(getReleaseNotesPreview(CURRENT_RELEASE_VERSION, 'development')).toEqual([]);
    expect(getReleaseNotesPreview('1', 'production')).toBeNull();
    expect(getReleaseNotesPreview(null, 'development')).toBeNull();
    expect(getReleaseNotesPreview('yesterday', 'development')).toBeNull();
  });

  it('matches the package version to the newest release', () => {
    const packageJson = z
      .object({ version: z.string() })
      .parse(JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')));
    expect(packageJson.version).toBe(CURRENT_RELEASE_VERSION);
  });
});
