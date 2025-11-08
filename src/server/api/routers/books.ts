import { z } from 'zod';
import { and, eq, or, ilike, count, asc, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { books } from '@/server/db/schema';
import type { Book } from '@/types';

export const booksRouter = createTRPCRouter({
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

      const conditions = [eq(books.userId, ctx.session.user.id)];

      if (isRead !== undefined) {
        conditions.push(eq(books.isRead, isRead));
      }

      if (search && search.trim()) {
        conditions.push(
          or(
            ilike(books.title, `%${search}%`),
            ilike(books.author, `%${search}%`),
            ilike(books.genre, `%${search}%`)
          )!
        );
      }

      const where = and(...conditions);

      // Get total count for pagination
      const countResult = await ctx.db.select({ totalCount: count() }).from(books).where(where);
      const totalCount = countResult[0]?.totalCount ?? 0;

      // Get paginated results
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
