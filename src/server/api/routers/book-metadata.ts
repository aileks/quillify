import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { BOOK_AUTHOR_MAX_LENGTH, BOOK_TITLE_MAX_LENGTH } from '@/lib/book-validation';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import {
  OpenLibraryServiceError,
  searchOpenLibrary,
  searchOpenLibraryCatalog,
} from '@/server/services/book-metadata/open-library';

const searchOpenLibraryInputSchema = z.object({
  title: z.string().trim().min(1).max(BOOK_TITLE_MAX_LENGTH),
  author: z.string().trim().min(1).max(BOOK_AUTHOR_MAX_LENGTH).optional(),
});

const searchCatalogInputSchema = z.object({
  query: z.string().trim().min(1).max(240),
});

async function requestOpenLibrary<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof OpenLibraryServiceError) {
      throw new TRPCError({
        code: error.code === 'timeout' ? 'TIMEOUT' : 'BAD_GATEWAY',
        message:
          error.code === 'timeout' ?
            'Open Library took too long to respond'
          : 'Open Library is unavailable right now',
        cause: error,
      });
    }

    throw error;
  }
}

export const bookMetadataRouter = createTRPCRouter({
  searchOpenLibrary: protectedProcedure
    .input(searchOpenLibraryInputSchema)
    .query(({ input }) => requestOpenLibrary(() => searchOpenLibrary(input))),
  searchCatalog: protectedProcedure
    .input(searchCatalogInputSchema)
    .query(({ input }) => requestOpenLibrary(() => searchOpenLibraryCatalog(input))),
});
