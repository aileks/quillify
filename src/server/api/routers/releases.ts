import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

import { CURRENT_RELEASE_VERSION, getUnseenReleases } from '@/lib/releases';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { users } from '@/server/db/schema';

export const releasesRouter = createTRPCRouter({
  unseen: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ lastSeenReleaseVersion: users.lastSeenReleaseVersion })
      .from(users)
      .where(eq(users.id, ctx.session.user.id));
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });
    }

    return {
      currentVersion: CURRENT_RELEASE_VERSION,
      releases: getUnseenReleases(user.lastSeenReleaseVersion),
    };
  }),

  markSeen: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .update(users)
      .set({ lastSeenReleaseVersion: CURRENT_RELEASE_VERSION })
      .where(eq(users.id, ctx.session.user.id))
      .returning({ lastSeenReleaseVersion: users.lastSeenReleaseVersion });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });
    }

    return user;
  }),
});
