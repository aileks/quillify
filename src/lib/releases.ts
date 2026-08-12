export interface ReleaseManifestEntry {
  version: `${number}.${number}.${number}`;
  title: string;
  notes: readonly string[];
}

export const RELEASE_MANIFEST = [
  {
    version: '2.1.0',
    title: 'A more portable Library',
    notes: [
      'Catalog books now retain ISBN and Open Library edition details, with a warning before likely duplicates are added.',
      'Goodreads CSV imports include a review step for missing details, duplicates, and previously imported books.',
      'Versioned JSON backups are available from the new Data tab in Account Settings.',
    ],
  },
] as const satisfies readonly ReleaseManifestEntry[];

export const CURRENT_RELEASE_VERSION = RELEASE_MANIFEST[0].version;

function parseSemanticVersion(version: string): readonly [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return null;

  const [, major, minor, patch] = match;
  return [Number(major), Number(minor), Number(patch)];
}

export function compareSemanticVersions(left: string, right: string): number {
  const leftParts = parseSemanticVersion(left);
  const rightParts = parseSemanticVersion(right);
  if (!leftParts || !rightParts) {
    throw new Error('Release versions must use major.minor.patch semantic versioning');
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!;
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function getUnseenReleases(lastSeenReleaseVersion: string | null) {
  if (!lastSeenReleaseVersion || !parseSemanticVersion(lastSeenReleaseVersion)) {
    return RELEASE_MANIFEST;
  }

  return RELEASE_MANIFEST.filter(
    (release) => compareSemanticVersions(release.version, lastSeenReleaseVersion) > 0
  );
}
