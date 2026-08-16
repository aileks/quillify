# Quillify Database Schema

Quillify uses PostgreSQL through Drizzle ORM. All application tables live in the `quillify` schema.
The TypeScript source is `src/server/db/schema.ts`.

## `users`

| Column                   | Type        | Constraints               |
| ------------------------ | ----------- | ------------------------- |
| `id`                     | text        | primary key               |
| `name`                   | text        | nullable                  |
| `email`                  | text        | nullable, unique          |
| `password`               | text        | not null, bcrypt hash     |
| `emailVerifiedAt`        | timestamptz | nullable                  |
| `lastSeenReleaseVersion` | text        | nullable                  |
| `createdAt`              | timestamptz | not null, defaults to now |
| `updatedAt`              | timestamptz | not null, defaults to now |

Laravel bcrypt hashes using the `$2y$` prefix remain supported by
`src/server/auth/password.ts`.

## `books`

| Column                 | Type        | Constraints                                     |
| ---------------------- | ----------- | ----------------------------------------------- |
| `id`                   | text        | primary key                                     |
| `userId`               | text        | not null, references `users.id`, cascade delete |
| `title`                | text        | not null                                        |
| `author`               | text        | not null                                        |
| `numberOfPages`        | integer     | not null                                        |
| `genre`                | text        | nullable, defaults to `Other`                   |
| `publishYear`          | integer     | not null                                        |
| `coverSource`          | text        | nullable, currently `open_library`              |
| `coverSourceId`        | text        | nullable Open Library cover ID                  |
| `isbn10`               | text        | nullable, canonical ISBN-10                     |
| `isbn13`               | text        | nullable, canonical ISBN-13                     |
| `openLibraryWorkId`    | text        | nullable Open Library work ID                   |
| `openLibraryEditionId` | text        | nullable Open Library edition ID                |
| `ownershipType`        | enum        | not null, defaults to `unknown`                 |
| `createdAt`            | timestamptz | not null, defaults to now                       |
| `updatedAt`            | timestamptz | not null, defaults to now                       |

Book bounds are enforced by shared Zod schemas in `src/lib/book-validation.ts`.

Ownership values are `unknown`, `owned`, `borrowed`, `library`, and `subscription`. Ownership is
book-level metadata and does not change when a new reading period begins.

## `reading_periods`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `bookId`    | text        | not null, references `books.id`, cascade delete |
| `status`    | enum        | not null, defaults to `to_read`                 |
| `format`    | enum        | nullable                                        |
| `startedOn` | date        | nullable                                        |
| `endedOn`   | date        | nullable                                        |
| `isCurrent` | boolean     | not null, defaults to true                      |
| `createdAt` | timestamptz | not null, defaults to now                       |
| `updatedAt` | timestamptz | not null, defaults to now                       |

Status values are `to_read`, `reading`, `paused`, `finished`, and `did_not_finish`. Format values
are `print`, `ebook`, and `audiobook`. A partial unique index allows at most one current reading
period per book. Finished and Did Not Finish periods remain as history when a reread begins.

## `book_import_sources`

| Column           | Type        | Constraints                                     |
| ---------------- | ----------- | ----------------------------------------------- |
| `id`             | text        | primary key                                     |
| `userId`         | text        | not null, references `users.id`, cascade delete |
| `bookId`         | text        | not null, references `books.id`, cascade delete |
| `source`         | enum        | not null, currently `goodreads`                 |
| `sourceRecordId` | text        | not null                                        |
| `createdAt`      | timestamptz | not null, defaults to now                       |

The user, source, and source record ID are unique together so an import can be retried safely.

## `tags`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `userId`    | text        | not null, references `users.id`, cascade delete |
| `name`      | text        | not null                                        |
| `createdAt` | timestamptz | not null, defaults to now                       |
| `updatedAt` | timestamptz | not null, defaults to now                       |

Tag names are unique per user, matched case-insensitively. Tags with no attached books remain until
deleted.

## `book_tags`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `bookId`    | text        | not null, references `books.id`, cascade delete |
| `tagId`     | text        | not null, references `tags.id`, cascade delete  |
| `createdAt` | timestamptz | not null, defaults to now                       |

A book and a tag are unique together.

## `lists`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `userId`    | text        | not null, references `users.id`, cascade delete |
| `name`      | text        | not null                                        |
| `createdAt` | timestamptz | not null, defaults to now                       |
| `updatedAt` | timestamptz | not null, defaults to now                       |

List names are unique per user, matched case-insensitively.

## `list_entries`

| Column      | Type        | Constraints                                      |
| ----------- | ----------- | ------------------------------------------------ |
| `id`        | text        | primary key                                      |
| `listId`    | text        | not null, references `lists.id`, cascade delete  |
| `bookId`    | text        | not null, references `books.id`, cascade delete  |
| `position`  | integer     | not null                                         |
| `createdAt` | timestamptz | not null, defaults to now                        |

A list and a book are unique together. Positions are contiguous from 1 and rewritten when entries
move or leave the list.

## `up_next_entries`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `userId`    | text        | not null, references `users.id`, cascade delete |
| `bookId`    | text        | not null, references `books.id`, cascade delete |
| `position`  | integer     | not null                                        |
| `createdAt` | timestamptz | not null, defaults to now                       |

A user and a book are unique together. The queue holds at most five books, enforced in application
logic. A book leaves the queue when it moves to any status other than To Read.

## `password_reset_tokens`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `userId`    | text        | not null, references `users.id`, cascade delete |
| `tokenHash` | text        | not null, unique, SHA-256                       |
| `expiresAt` | timestamptz | not null                                        |
| `createdAt` | timestamptz | not null, defaults to now                       |

Raw reset tokens are never stored. Links expire after 30 minutes. A successful reset deletes every
outstanding reset token for that user.

## `email_verification_tokens`

| Column      | Type        | Constraints                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | text        | primary key                                     |
| `userId`    | text        | not null, references `users.id`, cascade delete |
| `tokenHash` | text        | not null, unique, SHA-256                       |
| `expiresAt` | timestamptz | not null                                        |
| `createdAt` | timestamptz | not null, defaults to now                       |

Raw verification tokens are never stored. Links expire after 24 hours. Successful verification
deletes every outstanding verification token for that user.

## Relationships

- A user has many books, tags, lists, and import source records
- A book has many reading periods and exactly one current period under application invariants
- A book has many import source records, tags through `book_tags`, and list memberships through
  `list_entries`
- A user has many Up Next entries and each references one of their books
- A user has many password reset token attempts
- A user has many email verification token attempts
- Deleting a user cascades through books to reading periods, tags, lists, Up Next entries, and
  directly to both token tables

## Migrations

Migrations live in `src/server/drizzle/`.

- `0000` through `0009`, their snapshots, and their order are historical compatibility records
  carried forward from the Laravel migration path. They are immutable.
- New schema changes must be appended with `pnpm db:generate`.
- `scripts/ensure-db-schema.ts` creates the `quillify` namespace before migrate, push, or studio.
- Do not use `db:push` against production.
- Migration `0010` invalidates existing reset and verification links before renaming plaintext token
  columns to `tokenHash`.
- Migration `0011` adds nullable cover source and cover ID columns to books.
- Migration `0012` adds lifecycle enums, ownership, and reading periods; backfills every existing
  book from `isRead`; then removes the binary column.
- Migration `0013` adds canonical ISBN and Open Library work and edition identity to books.
- Migration `0014` adds Goodreads import provenance and its idempotency constraint.
- Migration `0015` adds the account-backed release notes marker.
- Migration `0016` adds tags, book tags, lists, list entries, and Up Next entries.

The daily cron route removes expired rows from both token tables.
