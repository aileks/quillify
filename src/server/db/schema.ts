import {
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgSchema,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

const quillify = pgSchema('quillify');

export const readingStatusEnum = quillify.enum('reading_status', [
  'to_read',
  'reading',
  'paused',
  'finished',
  'did_not_finish',
]);
export const readingFormatEnum = quillify.enum('reading_format', ['print', 'ebook', 'audiobook']);
export const ownershipTypeEnum = quillify.enum('ownership_type', [
  'unknown',
  'owned',
  'borrowed',
  'library',
  'subscription',
]);
export const importSourceEnum = quillify.enum('import_source', ['goodreads']);

export const users = quillify.table('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  password: text('password').notNull(),
  emailVerifiedAt: timestamp('emailVerifiedAt', { mode: 'date', withTimezone: true }),
  lastSeenReleaseVersion: text('lastSeenReleaseVersion'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const books = quillify.table(
  'books',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    author: text('author').notNull(),
    numberOfPages: integer('numberOfPages').notNull(),
    genre: text('genre').default('Other'),
    publishYear: integer('publishYear').notNull(),
    coverSource: text('coverSource'),
    coverSourceId: text('coverSourceId'),
    isbn10: text('isbn10'),
    isbn13: text('isbn13'),
    openLibraryWorkId: text('openLibraryWorkId'),
    openLibraryEditionId: text('openLibraryEditionId'),
    ownershipType: ownershipTypeEnum('ownershipType').notNull().default('unknown'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('books_user_isbn13_index').on(table.userId, table.isbn13),
    index('books_user_open_library_edition_index').on(table.userId, table.openLibraryEditionId),
  ]
);

export const readingPeriods = quillify.table(
  'reading_periods',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bookId: text('bookId')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    status: readingStatusEnum('status').notNull().default('to_read'),
    format: readingFormatEnum('format'),
    startedOn: date('startedOn', { mode: 'string' }),
    endedOn: date('endedOn', { mode: 'string' }),
    isCurrent: boolean('isCurrent').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('reading_periods_current_book_unique')
      .on(table.bookId)
      .where(sql`${table.isCurrent} = true`),
  ]
);

export const bookImportSources = quillify.table(
  'book_import_sources',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: text('bookId')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    source: importSourceEnum('source').notNull(),
    sourceRecordId: text('sourceRecordId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('book_import_sources_user_source_record_unique').on(
      table.userId,
      table.source,
      table.sourceRecordId
    ),
    index('book_import_sources_book_index').on(table.bookId),
  ]
);

export const passwordResetTokens = quillify.table('password_reset_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('tokenHash').notNull().unique(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
});

export const emailVerificationTokens = quillify.table('email_verification_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('tokenHash').notNull().unique(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  books: many(books),
  bookImportSources: many(bookImportSources),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  readingPeriods: many(readingPeriods),
  importSources: many(bookImportSources),
}));

export const readingPeriodsRelations = relations(readingPeriods, ({ one }) => ({
  book: one(books, {
    fields: [readingPeriods.bookId],
    references: [books.id],
  }),
}));

export const bookImportSourcesRelations = relations(bookImportSources, ({ one }) => ({
  user: one(users, {
    fields: [bookImportSources.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [bookImportSources.bookId],
    references: [books.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));
