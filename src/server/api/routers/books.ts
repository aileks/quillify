import { z } from 'zod';
import {
  and,
  eq,
  or,
  ilike,
  isNotNull,
  inArray,
  count,
  asc,
  desc,
  min,
  max,
  sql,
} from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { books, readingPeriods, users } from '@/server/db/schema';
import type { Book, BookWithCurrentPeriod, BookWithReadingHistory } from '@/types';
import { bookCreateInputSchema, bookMetadataUpdateInputSchema } from '@/lib/book-validation';
import {
  canTransitionReadingStatus,
  isTerminalReadingStatus,
  readingStatusSchema,
  transitionReadingStatusSchema,
  updateReadingPeriodSchema,
} from '@/lib/reading-lifecycle';

export const booksRouter = createTRPCRouter({
  /**
   * Get aggregated statistics for the user's book collection.
   * Uses SQL aggregation for efficient computation instead of fetching all rows.
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [aggregates, finishedAggregates, statusRows, topGenres, recentlyAdded] =
      await Promise.all([
        ctx.db
          .select({
            totalBooks: count(),
            totalPages: sql<number>`COALESCE(SUM(${books.numberOfPages}), 0)`.mapWith(Number),
            avgPages: sql<number>`COALESCE(ROUND(AVG(${books.numberOfPages})), 0)`.mapWith(Number),
            oldestYear: min(books.publishYear),
            newestYear: max(books.publishYear),
          })
          .from(books)
          .where(eq(books.userId, userId)),
        ctx.db
          .select({
            finishedReads: count(),
            totalPagesRead:
              sql<number>`COALESCE(SUM(${books.numberOfPages}) FILTER (WHERE ${readingPeriods.format} IS NULL OR ${readingPeriods.format} <> 'audiobook'), 0)`.mapWith(
                Number
              ),
          })
          .from(readingPeriods)
          .innerJoin(books, eq(readingPeriods.bookId, books.id))
          .where(and(eq(books.userId, userId), eq(readingPeriods.status, 'finished'))),
        ctx.db
          .select({ status: readingPeriods.status, count: count() })
          .from(readingPeriods)
          .innerJoin(books, eq(readingPeriods.bookId, books.id))
          .where(and(eq(books.userId, userId), eq(readingPeriods.isCurrent, true)))
          .groupBy(readingPeriods.status),
        ctx.db
          .select({ genre: books.genre, count: count() })
          .from(books)
          .where(and(eq(books.userId, userId), isNotNull(books.genre)))
          .groupBy(books.genre)
          .orderBy(desc(count()))
          .limit(3),
        ctx.db
          .select({
            id: books.id,
            title: books.title,
            author: books.author,
            createdAt: books.createdAt,
          })
          .from(books)
          .where(eq(books.userId, userId))
          .orderBy(desc(books.createdAt))
          .limit(3),
      ]);

    const statusCounts = {
      to_read: 0,
      reading: 0,
      paused: 0,
      finished: 0,
      did_not_finish: 0,
    };
    for (const row of statusRows) {
      statusCounts[row.status] = row.count;
    }

    return {
      totalBooks: aggregates[0]?.totalBooks ?? 0,
      finishedReads: finishedAggregates[0]?.finishedReads ?? 0,
      statusCounts,
      totalPages: aggregates[0]?.totalPages ?? 0,
      totalPagesRead: finishedAggregates[0]?.totalPagesRead ?? 0,
      averagePages: aggregates[0]?.avgPages ?? 0,
      oldestPublishYear: aggregates[0]?.oldestYear ?? null,
      newestPublishYear: aggregates[0]?.newestYear ?? null,
      topGenres: topGenres.map((g) => ({ genre: g.genre ?? 'Other', count: g.count })),
      recentlyAdded,
    };
  }),

  list: protectedProcedure
    .input(
      z.object({
        status: readingStatusSchema.optional(),
        search: z.string().optional(),
        genre: z.array(z.string()).optional(),
        sortBy: z.enum(['title', 'author', 'createdAt']).default('title'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, search, genre, sortBy, sortOrder, page, pageSize } = input;

      // Build dynamic WHERE conditions array
      const conditions = [eq(books.userId, ctx.session.user.id)];

      if (status !== undefined) {
        conditions.push(eq(readingPeriods.status, status));
      }

      if (search && search.trim()) {
        // Search across title, author, and genre fields using case-insensitive LIKE
        conditions.push(
          or(
            ilike(books.title, `%${search}%`),
            ilike(books.author, `%${search}%`),
            ilike(books.genre, `%${search}%`)
          )!
        );
      }

      if (genre && genre.length > 0) {
        conditions.push(inArray(books.genre, genre));
      }

      // Combine all conditions with AND logic
      const where = and(...conditions);

      // Get total count for pagination (must run before pagination to get accurate count)
      const countResult = await ctx.db
        .select({ totalCount: count() })
        .from(books)
        .innerJoin(
          readingPeriods,
          and(eq(readingPeriods.bookId, books.id), eq(readingPeriods.isCurrent, true))
        )
        .where(where);
      const totalCount = countResult[0]?.totalCount ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      const effectivePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

      // Dynamically select sort column and direction
      const orderByColumn =
        sortBy === 'title' ? books.title
        : sortBy === 'author' ? books.author
        : books.createdAt;
      const orderByFn = sortOrder === 'asc' ? asc : desc;

      const rows = await ctx.db
        .select({ book: books, currentReadingPeriod: readingPeriods })
        .from(books)
        .innerJoin(
          readingPeriods,
          and(eq(readingPeriods.bookId, books.id), eq(readingPeriods.isCurrent, true))
        )
        .where(where)
        .orderBy(orderByFn(orderByColumn), orderByFn(books.id))
        .limit(pageSize)
        .offset((effectivePage - 1) * pageSize);

      return {
        items: rows.map(({ book, currentReadingPeriod }) => ({
          ...book,
          currentReadingPeriod,
        })) as BookWithCurrentPeriod[],
        totalCount,
        page: effectivePage,
        pageSize,
        totalPages,
      };
    }),

  // Get a single book by ID (owned by current user)
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [book] = await ctx.db
      .select()
      .from(books)
      .where(and(eq(books.id, input.id), eq(books.userId, ctx.session.user.id)));

    if (!book) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const periods = await ctx.db
      .select()
      .from(readingPeriods)
      .where(eq(readingPeriods.bookId, book.id))
      .orderBy(desc(readingPeriods.createdAt), desc(readingPeriods.id));
    const currentReadingPeriod = periods.find(({ isCurrent }) => isCurrent);

    if (!currentReadingPeriod) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    return {
      ...book,
      currentReadingPeriod,
      readingPeriods: periods,
    } as BookWithReadingHistory;
  }),

  // Create a new book for the current user
  create: protectedProcedure.input(bookCreateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    // Check if user is verified - unverified users have a 10-book limit
    const [user] = await ctx.db.select().from(users).where(eq(users.id, userId));

    if (user && !user.emailVerifiedAt) {
      // Count existing books for this user
      const [bookCount] = await ctx.db
        .select({ count: count() })
        .from(books)
        .where(eq(books.userId, userId));

      if (bookCount && bookCount.count >= 10) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'BOOK_LIMIT_REACHED',
        });
      }
    }

    return ctx.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(books)
        .values({
          userId,
          title: input.title,
          author: input.author,
          numberOfPages: input.numberOfPages,
          genre: input.genre,
          publishYear: input.publishYear,
          coverSource: input.coverSource ?? null,
          coverSourceId: input.coverSourceId ?? null,
          ownershipType: input.ownershipType,
        })
        .returning();

      if (!inserted) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      const readingDetails = input.readingDetails ?? {
        status: 'to_read' as const,
        format: null,
        startedOn: null,
        endedOn: null,
      };
      const [currentReadingPeriod] = await tx
        .insert(readingPeriods)
        .values({ bookId: inserted.id, ...readingDetails })
        .returning();

      if (!currentReadingPeriod) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return { ...inserted, currentReadingPeriod } as BookWithCurrentPeriod;
    });
  }),

  // Update select fields on a book (owned by current user)
  update: protectedProcedure
    .input(bookMetadataUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(books).where(eq(books.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [updated] = await ctx.db
        .update(books)
        .set({
          title: input.title ?? existing.title,
          author: input.author ?? existing.author,
          numberOfPages: input.numberOfPages ?? existing.numberOfPages,
          // Special handling: undefined means "don't change", null means "set to null"
          genre: input.genre === undefined ? existing.genre : input.genre,
          publishYear: input.publishYear ?? existing.publishYear,
          coverSource: input.coverSource === undefined ? existing.coverSource : input.coverSource,
          coverSourceId:
            input.coverSourceId === undefined ? existing.coverSourceId : input.coverSourceId,
          ownershipType: input.ownershipType ?? existing.ownershipType,
        })
        .where(eq(books.id, input.id))
        .returning();

      return updated as Book;
    }),

  transitionStatus: protectedProcedure
    .input(transitionReadingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [book] = await tx
          .select()
          .from(books)
          .where(and(eq(books.id, input.bookId), eq(books.userId, ctx.session.user.id)));

        if (!book) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        const [currentPeriod] = await tx
          .select()
          .from(readingPeriods)
          .where(and(eq(readingPeriods.bookId, book.id), eq(readingPeriods.isCurrent, true)));

        if (!currentPeriod) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        if (!canTransitionReadingStatus(currentPeriod.status, input.status)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'INVALID_STATUS_TRANSITION' });
        }

        let updatedPeriod;
        if (isTerminalReadingStatus(currentPeriod.status)) {
          await tx
            .update(readingPeriods)
            .set({ isCurrent: false, updatedAt: new Date() })
            .where(eq(readingPeriods.id, currentPeriod.id));
          [updatedPeriod] = await tx
            .insert(readingPeriods)
            .values({
              bookId: book.id,
              status: input.status,
              format: input.format,
              startedOn: input.startedOn,
              endedOn: input.endedOn,
            })
            .returning();
        } else {
          [updatedPeriod] = await tx
            .update(readingPeriods)
            .set({
              status: input.status,
              format: input.format,
              startedOn: input.startedOn,
              endedOn: input.endedOn,
              updatedAt: new Date(),
            })
            .where(eq(readingPeriods.id, currentPeriod.id))
            .returning();
        }

        if (!updatedPeriod) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        return { bookId: book.id, title: book.title, currentReadingPeriod: updatedPeriod };
      });
    }),

  updateReadingPeriod: protectedProcedure
    .input(updateReadingPeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ period: readingPeriods, userId: books.userId })
        .from(readingPeriods)
        .innerJoin(books, eq(readingPeriods.bookId, books.id))
        .where(eq(readingPeriods.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const currentIsTerminal = isTerminalReadingStatus(existing.period.status);
      const nextIsTerminal = isTerminalReadingStatus(input.status);
      if (
        (currentIsTerminal && !nextIsTerminal) ||
        (!currentIsTerminal && input.status !== existing.period.status)
      ) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'INVALID_PERIOD_CORRECTION' });
      }

      const [updated] = await ctx.db
        .update(readingPeriods)
        .set({
          status: input.status,
          format: input.format,
          startedOn: input.startedOn,
          endedOn: input.endedOn,
          updatedAt: new Date(),
        })
        .where(eq(readingPeriods.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return updated;
    }),

  // Delete a book
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(books).where(eq(books.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await ctx.db.delete(books).where(eq(books.id, input.id));
      return { id: input.id };
    }),

  // Delete multiple books owned by the current user
  removeMany: protectedProcedure
    .input(
      z.object({
        ids: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .refine((ids) => new Set(ids).size === ids.length, {
            message: 'Book IDs must be unique',
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db.transaction(async (tx) => {
        const rows = await tx
          .delete(books)
          .where(and(eq(books.userId, ctx.session.user.id), inArray(books.id, input.ids)))
          .returning({ id: books.id });

        if (rows.length !== input.ids.length) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        return rows;
      });

      return { ids: deleted.map(({ id }) => id) };
    }),
});
