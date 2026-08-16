import { TRPCError } from '@trpc/server';
import { and, count, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { classifyDuplicateCandidate } from '@/lib/book-duplicates';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { db } from '@/server/db';
import { bookImportSources, bookTags, books, readingPeriods, users } from '@/server/db/schema';
import { resolveTags } from '@/server/services/organization';
import {
  GOODREADS_MAX_RECORDS,
  goodreadsImportRowSchema,
  parseGoodreadsCsv,
} from '@/server/services/goodreads-import';

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DatabaseExecutor = typeof db | DatabaseTransaction;

function chunkRows<T>(rows: T[], size = 250): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function getImportedSourceIds(
  tx: DatabaseExecutor,
  userId: string,
  sourceRecordIds: string[]
) {
  if (sourceRecordIds.length === 0) return new Set<string>();

  const imported = await tx
    .select({ sourceRecordId: bookImportSources.sourceRecordId })
    .from(bookImportSources)
    .where(
      and(
        eq(bookImportSources.userId, userId),
        eq(bookImportSources.source, 'goodreads'),
        inArray(bookImportSources.sourceRecordId, sourceRecordIds)
      )
    );
  return new Set(imported.map(({ sourceRecordId }) => sourceRecordId));
}

async function getDuplicateCandidates(tx: DatabaseExecutor, userId: string) {
  return tx
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      publishYear: books.publishYear,
      coverSourceId: books.coverSourceId,
      isbn13: books.isbn13,
      openLibraryEditionId: books.openLibraryEditionId,
    })
    .from(books)
    .where(eq(books.userId, userId));
}

export const dataTransferRouter = createTRPCRouter({
  previewGoodreadsImport: protectedProcedure
    .input(z.object({ csv: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      let rows;
      try {
        rows = parseGoodreadsCsv(input.csv);
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Could not parse the Goodreads CSV',
        });
      }

      const userId = ctx.session.user.id;
      const [importedSourceIds, duplicateCandidates] = await Promise.all([
        getImportedSourceIds(
          ctx.db,
          userId,
          rows.map(({ sourceRecordId }) => sourceRecordId).filter(Boolean)
        ),
        getDuplicateCandidates(ctx.db, userId),
      ]);

      const previewRows = rows.map((row) => {
        if (row.previewStatus === 'invalid') return row;
        if (importedSourceIds.has(row.sourceRecordId)) {
          return { ...row, previewStatus: 'already_imported' as const };
        }
        const publishYear = row.publishYear;
        if (row.previewStatus === 'needs_attention' || publishYear === null) return row;

        const isLikelyDuplicate = duplicateCandidates.some(
          (candidate) =>
            classifyDuplicateCandidate(candidate, {
              title: row.title,
              author: row.author,
              publishYear,
              isbn13: row.isbn13,
            }) !== null
        );
        return {
          ...row,
          previewStatus: isLikelyDuplicate ? ('likely_duplicate' as const) : ('ready' as const),
        };
      });

      return {
        rows: previewRows,
        summary: previewRows.reduce(
          (summary, row) => ({
            ...summary,
            [row.previewStatus]: summary[row.previewStatus] + 1,
          }),
          { ready: 0, needs_attention: 0, likely_duplicate: 0, already_imported: 0, invalid: 0 }
        ),
      };
    }),

  importGoodreads: protectedProcedure
    .input(
      z.object({
        rows: z.array(goodreadsImportRowSchema).min(1).max(GOODREADS_MAX_RECORDS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db.transaction(async (tx) => {
        const sourceRecordIds = input.rows.map(({ sourceRecordId }) => sourceRecordId);
        if (new Set(sourceRecordIds).size !== sourceRecordIds.length) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Repeated Goodreads Book ID' });
        }

        const [importedSourceIds, duplicateCandidates] = await Promise.all([
          getImportedSourceIds(tx, userId, sourceRecordIds),
          getDuplicateCandidates(tx, userId),
        ]);
        const rowsToCreate = input.rows.filter((row) => {
          if (importedSourceIds.has(row.sourceRecordId)) return false;
          if (row.importAsSeparateEdition) return true;
          return !duplicateCandidates.some(
            (candidate) => classifyDuplicateCandidate(candidate, row) !== null
          );
        });

        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (user && !user.emailVerifiedAt) {
          const [bookCount] = await tx
            .select({ count: count() })
            .from(books)
            .where(eq(books.userId, userId));
          if ((bookCount?.count ?? 0) + rowsToCreate.length > 10) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'BOOK_LIMIT_REACHED' });
          }
        }

        const records = rowsToCreate.map((row) => ({
          row,
          bookId: crypto.randomUUID(),
        }));
        for (const recordChunk of chunkRows(records)) {
          await tx.insert(books).values(
            recordChunk.map(({ row, bookId }) => ({
              id: bookId,
              userId,
              title: row.title,
              author: row.author,
              numberOfPages: row.numberOfPages,
              genre: 'Other',
              publishYear: row.publishYear,
              isbn10: row.isbn10,
              isbn13: row.isbn13,
              ownershipType: row.ownershipType,
            }))
          );
          await tx.insert(readingPeriods).values(
            recordChunk.map(({ row, bookId }) => ({
              bookId,
              status: row.readingStatus,
              format: row.readingFormat,
              startedOn: null,
              endedOn: row.readingStatus === 'finished' ? row.endedOn : null,
              isCurrent: true,
            }))
          );
          await tx.insert(bookImportSources).values(
            recordChunk.map(({ row, bookId }) => ({
              userId,
              bookId,
              source: 'goodreads' as const,
              sourceRecordId: row.sourceRecordId,
            }))
          );
        }

        const allTagNames = [...new Set(rowsToCreate.flatMap((row) => row.tags))];
        if (allTagNames.length > 0) {
          const resolvedTags = await resolveTags(tx, userId, allTagNames);
          const tagIdByName = new Map(resolvedTags.map((tag) => [tag.name.toLowerCase(), tag.id]));
          const bookTagRows = records.flatMap(({ row, bookId }) =>
            row.tags.flatMap((name) => {
              const tagId = tagIdByName.get(name.toLowerCase());
              return tagId ? [{ bookId, tagId }] : [];
            })
          );
          if (bookTagRows.length > 0) {
            await tx.insert(bookTags).values(bookTagRows).onConflictDoNothing();
          }
        }

        return {
          created: rowsToCreate.length,
          skipped: input.rows.length - rowsToCreate.length,
        };
      });
    }),
});
