import { text, integer, boolean, timestamp, pgSchema } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const quillify = pgSchema('quillify');

export const users = quillify.table('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  password: text('password'),
  emailVerifiedAt: timestamp('emailVerifiedAt', { mode: 'date', withTimezone: true }),
});

export const books = quillify.table('books', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  numberOfPages: integer('numberOfPages').notNull(),
  genre: text('genre'),
  publishYear: integer('publishYear').notNull(),
  isRead: boolean('isRead').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
}));
