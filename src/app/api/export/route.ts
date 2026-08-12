import { eq } from 'drizzle-orm';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { bookImportSources, books, readingPeriods, users } from '@/server/db/schema';
import { createLibraryBackup } from '@/server/services/library-export';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
  }

  const userId = session.user.id;
  const [account] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!account) {
    return Response.json({ error: 'Account not found' }, { status: 404, headers: PRIVATE_HEADERS });
  }

  const [libraryBooks, libraryReadingPeriods, libraryImportSources] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        numberOfPages: books.numberOfPages,
        genre: books.genre,
        publishYear: books.publishYear,
        coverSource: books.coverSource,
        coverSourceId: books.coverSourceId,
        isbn10: books.isbn10,
        isbn13: books.isbn13,
        openLibraryWorkId: books.openLibraryWorkId,
        openLibraryEditionId: books.openLibraryEditionId,
        ownershipType: books.ownershipType,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })
      .from(books)
      .where(eq(books.userId, userId)),
    db
      .select({
        id: readingPeriods.id,
        bookId: readingPeriods.bookId,
        status: readingPeriods.status,
        format: readingPeriods.format,
        startedOn: readingPeriods.startedOn,
        endedOn: readingPeriods.endedOn,
        isCurrent: readingPeriods.isCurrent,
        createdAt: readingPeriods.createdAt,
        updatedAt: readingPeriods.updatedAt,
      })
      .from(readingPeriods)
      .innerJoin(books, eq(readingPeriods.bookId, books.id))
      .where(eq(books.userId, userId)),
    db
      .select({
        bookId: bookImportSources.bookId,
        source: bookImportSources.source,
        sourceRecordId: bookImportSources.sourceRecordId,
        createdAt: bookImportSources.createdAt,
      })
      .from(bookImportSources)
      .where(eq(bookImportSources.userId, userId)),
  ]);

  const backup = createLibraryBackup({
    account,
    books: libraryBooks,
    readingPeriods: libraryReadingPeriods,
    importSources: libraryImportSources,
  });
  const date = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      ...PRIVATE_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="quillify-backup-${date}.json"`,
    },
  });
}
