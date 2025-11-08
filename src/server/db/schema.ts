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
  // FIXME: Migrate DB to rename column on prod
  emailVerified: timestamp('email_verified_at', { mode: 'date', withTimezone: true }),
  image: text('image'),
});

export const books = quillify.table('books', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  numberOfPages: integer('number_of_pages').notNull(),
  genre: text('genre'),
  publishYear: integer('publish_year').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
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
