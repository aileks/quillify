import { z } from 'zod';
import { and, eq, or, ilike, isNotNull, count, asc, desc, min, max, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { books } from '@/server/db/schema';
import type { Book } from '@/types';

export const booksRouter = createTRPCRouter({
  /**
   * Get aggregated statistics for the user's book collection.
   * Uses SQL aggregation for efficient computation instead of fetching all rows.
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Aggregate stats query using SQL functions
    const [aggregates] = await ctx.db
      .select({
        totalBooks: count(),
        readBooks: sql<number>`COUNT(*) FILTER (WHERE ${books.isRead} = true)`.mapWith(Number),
        totalPages: sql<number>`COALESCE(SUM(${books.numberOfPages}), 0)`.mapWith(Number),
        totalPagesRead:
          sql<number>`COALESCE(SUM(${books.numberOfPages}) FILTER (WHERE ${books.isRead} = true), 0)`.mapWith(
            Number
          ),
        avgPages: sql<number>`COALESCE(ROUND(AVG(${books.numberOfPages})), 0)`.mapWith(Number),
        oldestYear: min(books.publishYear),
        newestYear: max(books.publishYear),
      })
      .from(books)
      .where(eq(books.userId, userId));

    // Top genres query (top 3)
    const topGenres = await ctx.db
      .select({
        genre: books.genre,
        count: count(),
      })
      .from(books)
      .where(and(eq(books.userId, userId), isNotNull(books.genre)))
      .groupBy(books.genre)
      .orderBy(desc(count()))
      .limit(3);

    // Recently added books (last 3)
    const recentlyAdded = await ctx.db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(eq(books.userId, userId))
      .orderBy(desc(books.createdAt))
      .limit(3);

    return {
      totalBooks: aggregates?.totalBooks ?? 0,
      readBooks: aggregates?.readBooks ?? 0,
      unreadBooks: (aggregates?.totalBooks ?? 0) - (aggregates?.readBooks ?? 0),
      totalPages: aggregates?.totalPages ?? 0,
      totalPagesRead: aggregates?.totalPagesRead ?? 0,
      averagePages: aggregates?.avgPages ?? 0,
      oldestPublishYear: aggregates?.oldestYear ?? null,
      newestPublishYear: aggregates?.newestYear ?? null,
      topGenres: topGenres.map((g) => ({ genre: g.genre ?? 'Other', count: g.count })),
      recentlyAdded,
    };
  }),

  list: protectedProcedure
    .input(
      z.object({
        isRead: z.boolean().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['title', 'author', 'createdAt']).default('title'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { isRead, search, sortBy, sortOrder, page, pageSize } = input;

      // Build dynamic WHERE conditions array
      const conditions = [eq(books.userId, ctx.session.user.id)];

      if (isRead !== undefined) {
        conditions.push(eq(books.isRead, isRead));
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

      // Combine all conditions with AND logic
      const where = and(...conditions);

      // Get total count for pagination (must run before pagination to get accurate count)
      const countResult = await ctx.db.select({ totalCount: count() }).from(books).where(where);
      const totalCount = countResult[0]?.totalCount ?? 0;

      // Dynamically select sort column and direction
      const orderByColumn =
        sortBy === 'title' ? books.title
        : sortBy === 'author' ? books.author
        : books.createdAt;
      const orderByFn = sortOrder === 'asc' ? asc : desc;

      const rows = await ctx.db
        .select()
        .from(books)
        .where(where)
        .orderBy(orderByFn(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return {
        items: rows as Book[],
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
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

    return book as Book;
  }),

  // Create a new book for the current user
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        numberOfPages: z.number().int().positive(),
        genre: z.string().optional(),
        publishYear: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(books)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          author: input.author,
          numberOfPages: input.numberOfPages,
          genre: input.genre,
          publishYear: input.publishYear,
        })
        .returning();

      return inserted as Book;
    }),

  // Update select fields on a book (owned by current user)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        author: z.string().min(1).optional(),
        numberOfPages: z.number().int().positive().optional(),
        genre: z.string().nullable().optional(),
        publishYear: z.number().int().positive().optional(),
      })
    )
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
        })
        .where(eq(books.id, input.id))
        .returning();

      return updated as Book;
    }),

  // Toggle or set read status
  setRead: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isRead: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(books).where(eq(books.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [updated] = await ctx.db
        .update(books)
        .set({ isRead: input.isRead })
        .where(eq(books.id, input.id))
        .returning();

      return updated as Book;
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
});
