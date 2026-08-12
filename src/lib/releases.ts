export interface ReleaseManifestEntry {
  version: `${number}.${number}.${number}`;
  title: string;
  notes: readonly {
    title: string;
    description: string;
  }[];
}

export const RELEASE_MANIFEST = [
  {
    version: '2.1.1',
    title: 'A more portable Library',
    notes: [
      {
        title: 'Catalog identity and duplicate protection.',
        description:
          'Books added from Open Library now keep their ISBN, work, and edition details. When a matching edition or likely duplicate is found, you can review it before saving and still choose to add a separate edition.',
      },
      {
        title: 'Import your Library from Goodreads.',
        description:
          'This brand-new import brings your Goodreads library into Quillify, mapping Read, Currently Reading, and To Read alongside core book details. Open Account Settings, select the Data tab, and choose a Goodreads CSV to review duplicates, correct missing pages or publication years, and import the books you want.',
      },
      {
        title: 'Download a portable Library backup.',
        description:
          'Open Account Settings and select the Data tab to download a versioned JSON backup containing your books, catalog details, reading history, and import history. Passwords and account tokens are never included.',
      },
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
