import { z } from 'zod';
import { asc, eq, count, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { bookTags, tags } from '@/server/db/schema';
import { BULK_BOOK_IDS_MAX, tagNameSchema, tagNamesSchema } from '@/lib/organization';
import {
  addTagsToBooks,
  assertBooksOwned,
  removeTagsFromBooks,
} from '@/server/services/organization';

const bookIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(BULK_BOOK_IDS_MAX)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Book IDs must be unique',
  });

export const tagsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) =>
    ctx.db
      .select({ id: tags.id, name: tags.name, bookCount: count(bookTags.id) })
      .from(tags)
      .leftJoin(bookTags, eq(bookTags.tagId, tags.id))
      .where(eq(tags.userId, ctx.session.user.id))
      .groupBy(tags.id)
      .orderBy(asc(sql`lower(${tags.name})`))
  ),

  rename: protectedProcedure
    .input(z.object({ id: z.string().min(1), name: tagNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(tags).where(eq(tags.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existing.name.toLowerCase() === input.name.toLowerCase()) {
        return { id: existing.id, name: existing.name };
      }

      const [clash] = await ctx.db
        .select({ id: tags.id })
        .from(tags)
        .where(
          sql`${tags.userId} = ${ctx.session.user.id} AND lower(${tags.name}) = lower(${input.name})`
        );

      if (clash) {
        throw new TRPCError({ code: 'CONFLICT', message: 'NAME_TAKEN' });
      }

      const [renamed] = await ctx.db
        .update(tags)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(tags.id, input.id))
        .returning({ id: tags.id, name: tags.name });

      if (!renamed) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return renamed;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(tags).where(eq(tags.id, input.id));

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await ctx.db.delete(tags).where(eq(tags.id, input.id));
      return { id: input.id };
    }),

  addToBooks: protectedProcedure
    .input(z.object({ bookIds: bookIdsSchema, names: tagNamesSchema }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await assertBooksOwned(tx, ctx.session.user.id, input.bookIds);
        await addTagsToBooks(tx, ctx.session.user.id, input.bookIds, input.names);
        return { bookIds: input.bookIds };
      })
    ),

  removeFromBooks: protectedProcedure
    .input(z.object({ bookIds: bookIdsSchema, names: tagNamesSchema }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await assertBooksOwned(tx, ctx.session.user.id, input.bookIds);
        await removeTagsFromBooks(tx, ctx.session.user.id, input.bookIds, input.names);
        return { bookIds: input.bookIds };
      })
    ),
});
