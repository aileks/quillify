# Quillify Database Schema

Quillify uses PostgreSQL through Drizzle ORM. All application tables live in the `quillify` schema.
The TypeScript source is `src/server/db/schema.ts`.

## `users`

| Column            | Type        | Constraints               |
| ----------------- | ----------- | ------------------------- |
| `id`              | text        | primary key               |
| `name`            | text        | nullable                  |
| `email`           | text        | nullable, unique          |
| `password`        | text        | not null, bcrypt hash     |
| `emailVerifiedAt` | timestamptz | nullable                  |
| `createdAt`       | timestamptz | not null, defaults to now |
| `updatedAt`       | timestamptz | not null, defaults to now |

Laravel bcrypt hashes using the `$2y$` prefix remain supported by
`src/server/auth/password.ts`.

## `books`

| Column          | Type        | Constraints                                     |
| --------------- | ----------- | ----------------------------------------------- |
| `id`            | text        | primary key                                     |
| `userId`        | text        | not null, references `users.id`, cascade delete |
| `title`         | text        | not null                                        |
| `author`        | text        | not null                                        |
| `numberOfPages` | integer     | not null                                        |
| `genre`         | text        | nullable, defaults to `Other`                   |
| `publishYear`   | integer     | not null                                        |
| `coverSource`   | text        | nullable, currently `open_library`              |
| `coverSourceId` | text        | nullable Open Library cover ID                  |
| `ownershipType` | enum        | not null, defaults to `unknown`                 |
| `createdAt`     | timestamptz | not null, defaults to now                       |
| `updatedAt`     | timestamptz | not null, defaults to now                       |

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

- A user has many books
- A book has many reading periods and exactly one current period under application invariants
- A user has many password reset token attempts
- A user has many email verification token attempts
- Deleting a user cascades through books to reading periods and directly to both token tables

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

The daily cron route removes expired rows from both token tables.
