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
    version: '2.2.1',
    title: 'Fixes and polish',
    notes: [
      {
        title: 'The Library backup saves correctly again.',
        description:
          'The Download Backup button on the Data tab in Account Settings now saves your backup file instead of an error page.',
      },
      {
        title: 'Disabled buttons now look disabled.',
        description:
          'Buttons you cannot use yet appear dimmed and show a blocked cursor, so it is clearer which actions are available.',
      },
    ],
  },
  {
    version: '2.2.0',
    title: 'An organized Library',
    notes: [
      {
        title: 'Tags, a new way to label your books.',
        description:
          'Add your own tags when adding or editing a book, then filter the Library by tags next to genres. Search has been updated to include tags. Rename or delete a tag from the tag filter, and add or remove tags on many books at once from the Library selection mode.',
      },
      {
        title: 'Lists, a new way to curate books.',
        description:
          'Open the new Lists page in the sidebar to create named lists in your chosen order. Reorder books with the arrows on a list page, or add and remove several books at once from the Library selection mode.',
      },
      {
        title: 'Up Next: a new queue for choosing what to read.',
        description:
          'Add a To Read book to Up Next from its details page and see the queue on your home dashboard, where you can start reading without leaving home. The queue holds five books, and a book leaves it automatically once you start or abandon it.',
      },
      {
        title: 'Goodreads shelves import as tags.',
        description:
          'When you import a Goodreads CSV from the Data tab in Account Settings, your shelves beyond read, currently reading, and to read become tags on each book. The import preview shows the tags each row will receive.',
      },
      {
        title: 'Backups include your organization.',
        description: 'Updated data backups to include tags, lists, and Up Next.',
      },
    ],
  },
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

/**
 * Development-only release dialog preview: `1` previews every manifest entry,
 * a semantic version previews exactly what a reader who last saw that version
 * would receive. Returns null outside development or for other values.
 */
export function getReleaseNotesPreview(
  parameter: string | null,
  environment: string | undefined = process.env.NODE_ENV
) {
  if (environment !== 'development' || parameter === null) {
    return null;
  }

  if (parameter === '1') {
    return RELEASE_MANIFEST;
  }

  return parseSemanticVersion(parameter) ? getUnseenReleases(parameter) : null;
}
