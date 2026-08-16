interface ExportAccount {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ExportBook {
  id: string;
  title: string;
  author: string;
  numberOfPages: number;
  genre: string | null;
  publishYear: number;
  coverSource: string | null;
  coverSourceId: string | null;
  isbn10: string | null;
  isbn13: string | null;
  openLibraryWorkId: string | null;
  openLibraryEditionId: string | null;
  ownershipType: 'unknown' | 'owned' | 'borrowed' | 'library' | 'subscription';
  createdAt: Date;
  updatedAt: Date;
}

interface ExportReadingPeriod {
  id: string;
  bookId: string;
  status: 'to_read' | 'reading' | 'paused' | 'finished' | 'did_not_finish';
  format: 'print' | 'ebook' | 'audiobook' | null;
  startedOn: string | null;
  endedOn: string | null;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ExportImportSource {
  bookId: string;
  source: 'goodreads';
  sourceRecordId: string;
  createdAt: Date;
}

interface ExportBookTag {
  bookId: string;
  name: string;
}

interface ExportList {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ExportListEntry {
  listId: string;
  bookId: string;
  position: number;
}

interface ExportUpNextEntry {
  bookId: string;
  position: number;
}

interface CreateLibraryBackupOptions {
  account: ExportAccount;
  books: ExportBook[];
  readingPeriods: ExportReadingPeriod[];
  importSources: ExportImportSource[];
  bookTags: ExportBookTag[];
  lists: ExportList[];
  listEntries: ExportListEntry[];
  upNextEntries: ExportUpNextEntry[];
  exportedAt?: Date;
}

export function createLibraryBackup({
  account,
  books,
  readingPeriods,
  importSources,
  bookTags,
  lists,
  listEntries,
  upNextEntries,
  exportedAt = new Date(),
}: CreateLibraryBackupOptions) {
  const readingPeriodsByBookId = new Map<
    string,
    Array<
      Omit<ExportReadingPeriod, 'bookId' | 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt: string;
      }
    >
  >();
  for (const { bookId, ...period } of readingPeriods) {
    const bookPeriods = readingPeriodsByBookId.get(bookId) ?? [];
    bookPeriods.push({
      ...period,
      createdAt: period.createdAt.toISOString(),
      updatedAt: period.updatedAt.toISOString(),
    });
    readingPeriodsByBookId.set(bookId, bookPeriods);
  }

  const importSourcesByBookId = new Map<
    string,
    Array<Omit<ExportImportSource, 'bookId' | 'createdAt'> & { createdAt: string }>
  >();
  for (const { bookId, ...source } of importSources) {
    const bookSources = importSourcesByBookId.get(bookId) ?? [];
    bookSources.push({ ...source, createdAt: source.createdAt.toISOString() });
    importSourcesByBookId.set(bookId, bookSources);
  }

  const tagsByBookId = new Map<string, string[]>();
  for (const { bookId, name } of bookTags) {
    const bookTagNames = tagsByBookId.get(bookId) ?? [];
    bookTagNames.push(name);
    tagsByBookId.set(bookId, bookTagNames);
  }

  const orderedBookIdsByListId = new Map<string, string[]>();
  const entriesByAscendingPosition = [...listEntries].sort((a, b) => a.position - b.position);
  for (const { listId, bookId } of entriesByAscendingPosition) {
    const listBookIds = orderedBookIdsByListId.get(listId) ?? [];
    listBookIds.push(bookId);
    orderedBookIdsByListId.set(listId, listBookIds);
  }

  return {
    format: 'quillify-backup' as const,
    schemaVersion: 2 as const,
    exportedAt: exportedAt.toISOString(),
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    },
    books: books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      numberOfPages: book.numberOfPages,
      genre: book.genre,
      publishYear: book.publishYear,
      coverSource: book.coverSource,
      coverSourceId: book.coverSourceId,
      isbn10: book.isbn10,
      isbn13: book.isbn13,
      openLibraryWorkId: book.openLibraryWorkId,
      openLibraryEditionId: book.openLibraryEditionId,
      ownershipType: book.ownershipType,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      tags: (tagsByBookId.get(book.id) ?? []).sort((a, b) => a.localeCompare(b)),
      readingPeriods: readingPeriodsByBookId.get(book.id) ?? [],
      importSources: importSourcesByBookId.get(book.id) ?? [],
    })),
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      bookIds: orderedBookIdsByListId.get(list.id) ?? [],
    })),
    upNext: [...upNextEntries].sort((a, b) => a.position - b.position).map(({ bookId }) => bookId),
  };
}
