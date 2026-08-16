import { z } from 'zod';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { books, listEntries, lists, readingPeriods } from '@/server/db/schema';
import type { BookWithCurrentPeriod } from '@/types';
import { BULK_BOOK_IDS_MAX, listNameSchema, moveDirectionSchema } from '@/lib/organization';
import {
  addBooksToList,
  getOwnedList,
  moveListEntry,
  removeBooksFromList,
} from '@/server/services/organization';

const bookIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(BULK_BOOK_IDS_MAX)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Book IDs must be unique',
  });

export const listsRouter = createTRPCRouter({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: lists.id, name: lists.name, bookCount: count(listEntries.id) })
      .from(lists)
      .leftJoin(listEntries, eq(listEntries.listId, lists.id))
      .where(eq(lists.userId, ctx.session.user.id))
      .groupBy(lists.id)
      .orderBy(asc(lists.name), desc(lists.createdAt));

    return rows.map((row) => ({ ...row, bookCount: Number(row.bookCount) }));
  }),

  create: protectedProcedure
    .input(z.object({ name: listNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(lists)
        .values({ userId: ctx.session.user.id, name: input.name })
        .onConflictDoNothing()
        .returning({ id: lists.id, name: lists.name });

      if (!created) {
        throw new TRPCError({ code: 'CONFLICT', message: 'NAME_TAKEN' });
      }

      return created;
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.string().min(1), name: listNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(lists).where(eq(lists.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existing.name.toLowerCase() !== input.name.toLowerCase()) {
        const [clash] = await ctx.db
          .select({ id: lists.id })
          .from(lists)
          .where(
            sql`${lists.userId} = ${ctx.session.user.id} AND lower(${lists.name}) = lower(${input.name})`
          );

        if (clash) {
          throw new TRPCError({ code: 'CONFLICT', message: 'NAME_TAKEN' });
        }

        const [renamed] = await ctx.db
          .update(lists)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(lists.id, input.id))
          .returning({ id: lists.id, name: lists.name });

        if (!renamed) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        return renamed;
      }

      return { id: existing.id, name: existing.name };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(lists).where(eq(lists.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await ctx.db.delete(lists).where(eq(lists.id, input.id));
      return { id: input.id };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const list = await getOwnedList(ctx.db, ctx.session.user.id, input.id);

      const rows = await ctx.db
        .select({
          entryId: listEntries.id,
          position: listEntries.position,
          book: books,
          currentReadingPeriod: readingPeriods,
        })
        .from(listEntries)
        .innerJoin(books, eq(listEntries.bookId, books.id))
        .innerJoin(
          readingPeriods,
          and(eq(readingPeriods.bookId, books.id), eq(readingPeriods.isCurrent, true))
        )
        .where(eq(listEntries.listId, list.id))
        .orderBy(asc(listEntries.position), asc(listEntries.createdAt));

      return {
        id: list.id,
        name: list.name,
        items: rows.map(({ book, currentReadingPeriod, ...entry }) => ({
          ...entry,
          book: { ...book, currentReadingPeriod } as BookWithCurrentPeriod,
        })),
      };
    }),

  addBooks: protectedProcedure
    .input(z.object({ id: z.string().min(1), bookIds: bookIdsSchema }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await addBooksToList(tx, ctx.session.user.id, input.id, input.bookIds);
        return { id: input.id, bookIds: input.bookIds };
      })
    ),

  removeBooks: protectedProcedure
    .input(z.object({ id: z.string().min(1), bookIds: bookIdsSchema }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await removeBooksFromList(tx, ctx.session.user.id, input.id, input.bookIds);
        return { id: input.id, bookIds: input.bookIds };
      })
    ),

  moveEntry: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        entryId: z.string().min(1),
        direction: moveDirectionSchema,
      })
    )
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await moveListEntry(tx, ctx.session.user.id, input.id, input.entryId, input.direction);
        return { id: input.id };
      })
    ),
});
