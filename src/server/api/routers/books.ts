import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { books } from '@/server/db/schema';
import type { Book } from '@/types';

export const booksRouter = createTRPCRouter({
  // List the current user's books (optionally filter by read status)
  list: protectedProcedure
    .input(
      z
        .object({
          isRead: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where =
        input?.isRead !== undefined ?
          and(eq(books.userId, ctx.session.user.id), eq(books.isRead, input.isRead))
        : eq(books.userId, ctx.session.user.id);

      const rows = await ctx.db.query.books.findMany({
        where,
        orderBy: (b, { desc }) => [desc(b.createdAt)],
      });

      return rows;
    }),

  // Create a new book for the current user
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        numberOfPages: z.number().int().positive(),
        genre: z.string().optional(),
        publishYear: z.number().int().optional(),
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
        publishYear: z.number().int().nullable().optional(),
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
          publishYear: input.publishYear === undefined ? existing.publishYear : input.publishYear,
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
