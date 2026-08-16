import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { books, readingPeriods, upNextEntries } from '@/server/db/schema';
import type { BookWithCurrentPeriod } from '@/types';
import { moveDirectionSchema } from '@/lib/organization';
import {
  addToUpNext,
  getCurrentReadingStatusForBook,
  moveUpNextEntry,
  removeFromUpNext,
} from '@/server/services/organization';

export const upNextRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        position: upNextEntries.position,
        book: books,
        currentReadingPeriod: readingPeriods,
      })
      .from(upNextEntries)
      .innerJoin(books, eq(upNextEntries.bookId, books.id))
      .innerJoin(
        readingPeriods,
        and(eq(readingPeriods.bookId, books.id), eq(readingPeriods.isCurrent, true))
      )
      .where(eq(upNextEntries.userId, ctx.session.user.id))
      .orderBy(asc(upNextEntries.position), asc(upNextEntries.createdAt));

    return {
      items: rows.map(({ position, book, currentReadingPeriod }) => ({
        position,
        book: { ...book, currentReadingPeriod } as BookWithCurrentPeriod,
      })),
    };
  }),

  add: protectedProcedure
    .input(z.object({ bookId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        const status = await getCurrentReadingStatusForBook(tx, ctx.session.user.id, input.bookId);

        if (status !== 'to_read') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'NOT_TO_READ' });
        }

        await addToUpNext(tx, ctx.session.user.id, input.bookId);
        return { bookId: input.bookId };
      })
    ),

  remove: protectedProcedure
    .input(z.object({ bookId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await getCurrentReadingStatusForBook(tx, ctx.session.user.id, input.bookId);
        await removeFromUpNext(tx, ctx.session.user.id, input.bookId);
        return { bookId: input.bookId };
      })
    ),

  move: protectedProcedure
    .input(z.object({ bookId: z.string().min(1), direction: moveDirectionSchema }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await getCurrentReadingStatusForBook(tx, ctx.session.user.id, input.bookId);
        await moveUpNextEntry(tx, ctx.session.user.id, input.bookId, input.direction);
        return { bookId: input.bookId };
      })
    ),
});
