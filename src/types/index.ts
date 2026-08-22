import type { users, books, readingPeriods } from '@/server/db/schema';

/**
 * Inferred types from Drizzle schema for type-safe database operations
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type ReadingPeriod = typeof readingPeriods.$inferSelect;
export type NewReadingPeriod = typeof readingPeriods.$inferInsert;

export type BookWithCurrentPeriod = Book & {
  currentReadingPeriod: ReadingPeriod;
};

export type BookWithReadingHistory = BookWithCurrentPeriod & {
  readingPeriods: ReadingPeriod[];
  tags: string[];
};
