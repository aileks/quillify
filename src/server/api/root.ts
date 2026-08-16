import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';
import { booksRouter } from '@/server/api/routers/books';
import { authRouter } from '@/server/api/routers/auth';
import { bookMetadataRouter } from '@/server/api/routers/book-metadata';
import { dataTransferRouter } from '@/server/api/routers/data-transfer';
import { listsRouter } from '@/server/api/routers/lists';
import { releasesRouter } from '@/server/api/routers/releases';
import { tagsRouter } from '@/server/api/routers/tags';
import { upNextRouter } from '@/server/api/routers/up-next';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  books: booksRouter,
  auth: authRouter,
  bookMetadata: bookMetadataRouter,
  dataTransfer: dataTransferRouter,
  lists: listsRouter,
  releases: releasesRouter,
  tags: tagsRouter,
  upNext: upNextRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
