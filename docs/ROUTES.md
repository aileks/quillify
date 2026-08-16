# Quillify Routes

## App routes

| Route                      | Access    | Purpose                                             |
| -------------------------- | --------- | --------------------------------------------------- |
| `/`                        | Public    | Landing page or authenticated dashboard             |
| `/account/login`           | Public    | Log in and honor a safe local `callbackUrl`         |
| `/account/register`        | Public    | Create an account, sign in, and honor `callbackUrl` |
| `/account/forgot-password` | Public    | Request a password reset link                       |
| `/account/reset-password`  | Public    | Reset a password with the `token` query parameter   |
| `/account/verify-email`    | Redirect  | Show verification success, expiry, or failure       |
| `/account/settings`        | Protected | Manage the account, imports, and backups             |
| `/books`                   | Protected | Browse, search, filter, sort, select, and paginate  |
| `/books/new`               | Protected | Add a book                                          |
| `/books/[id]`              | Protected | View, edit, track, reread, or delete a book         |
| `/lists`                   | Protected | Browse, create, rename, and delete lists            |
| `/lists/[id]`              | Protected | View an ordered list, reorder, and manage entries   |

Protected `/books` routes are enforced in `src/app/books/layout.tsx`. Account settings performs its
own server redirect.

## API routes

| Route                      | Method | Purpose                                          |
| -------------------------- | ------ | ------------------------------------------------ |
| `/api/auth/[...nextauth]`  | Any    | Auth.js handlers                                 |
| `/api/trpc/[trpc]`         | POST   | Batched tRPC transport                           |
| `/api/verify-email`        | GET    | Consume a verification token and redirect        |
| `/api/cron/cleanup-tokens` | GET    | Remove expired reset and verification token rows |
| `/api/export`              | GET    | Download the authenticated account JSON backup   |

The cron route requires `Authorization: Bearer <CRON_SECRET>`.

## `books.*`

Every books procedure is protected.

| Procedure                   | Kind     | Input                                             | Result                                  |
| --------------------------- | -------- | ------------------------------------------------- | --------------------------------------- |
| `books.stats`               | Query    | None                                              | Library, lifecycle, totals, and top tags |
| `books.list`                | Query    | Search, status, genres, tags, sort, page, size    | Paginated books with current periods    |
| `books.getById`             | Query    | `{ id }`                                          | Owned book, periods, history, and tags  |
| `books.create`              | Mutation | Book, tags, and duplicate review action           | Created book or duplicate warning       |
| `books.update`              | Mutation | `{ id }` plus metadata, tags, and ownership       | Updated owned book                      |
| `books.transitionStatus`    | Mutation | Book ID, next status, format, and optional dates  | Updated or new current period           |
| `books.updateReadingPeriod` | Mutation | Period ID, outcome, format, and optional dates    | Corrected owned period                  |
| `books.remove`              | Mutation | `{ id }`                                          | Removed ID                              |
| `books.removeMany`          | Mutation | `{ ids }`, 1-100 unique IDs                       | Atomically removed IDs                  |

`books.list` defaults to page 1 and 12 rows. The UI always requests 12. Search covers title,
author, genre, and tag names. Tag filters match any of the selected tags. The server clamps pages
beyond the last available page.

Every current period can move directly to any reading status. Active periods and completed-outcome
corrections change in place. Moving from Finished or Did Not Finish to To Read, Reading, or Paused
creates a new current period and preserves the old one. Calendar dates are optional, cannot be in
the future, and must remain ordered. Historical corrections can switch only between Finished and
Did Not Finish outcomes. A book that moves to any status other than To Read leaves the Up Next
queue.

Shared book validation limits:

- title: 1-200 characters
- author: 1-120 characters
- genre: at most 80 characters
- pages: 1-100,000
- publication year: 1000 through five years after the current year

Unverified accounts can hold up to 10 books.

`books.create` returns no writes with likely user-scoped matches when the same edition, canonical
ISBN-13, or normalized title, author, and year already exists. A separate-edition action explicitly
bypasses that warning.

## `tags.*`

Every tags procedure is protected and user-scoped.

| Procedure             | Kind     | Input                             | Result                            |
| --------------------- | -------- | --------------------------------- | --------------------------------- |
| `tags.list`           | Query    | None                              | Tags with per-tag book counts     |
| `tags.rename`         | Mutation | `{ id, name }`                    | Renamed tag                       |
| `tags.remove`         | Mutation | `{ id }`                          | Removed ID, detachments cascade   |
| `tags.addToBooks`     | Mutation | `{ bookIds, names }`              | Tags attached to owned books      |
| `tags.removeFromBooks`| Mutation | `{ bookIds, names }`              | Tags detached from owned books    |

Tag names are trimmed, at most 40 characters, unique per user case-insensitively, and a book
carries at most 50. Unknown tags in `addToBooks` are created. Book IDs are capped at 100 unique
values per call. A rename that collides with an existing tag returns `CONFLICT` with `NAME_TAKEN`.

## `lists.*`

Every lists procedure is protected and user-scoped.

| Procedure           | Kind     | Input                              | Result                              |
| ------------------- | -------- | ---------------------------------- | ----------------------------------- |
| `lists.summary`     | Query    | None                               | Lists with per-list book counts     |
| `lists.create`      | Mutation | `{ name }`                         | Created list                        |
| `lists.rename`      | Mutation | `{ id, name }`                     | Renamed list                        |
| `lists.remove`      | Mutation | `{ id }`                           | Removed ID, entries cascade         |
| `lists.getById`     | Query    | `{ id }`                           | Ordered list with periods and tags   |
| `lists.addBooks`    | Mutation | `{ id, bookIds }`                  | Books appended in order             |
| `lists.removeBooks` | Mutation | `{ id, bookIds }`                  | Books removed, positions rewritten  |
| `lists.moveEntry`   | Mutation | `{ id, entryId, direction }`       | Entry swapped up or down            |

List names are trimmed, at most 60 characters, unique per user case-insensitively, and collisions
return `CONFLICT` with `NAME_TAKEN`. A book appears at most once per list. Moving past either end
is a no-op.

## `upNext.*`

Every Up Next procedure is protected and user-scoped.

| Procedure       | Kind     | Input                         | Result                          |
| --------------- | -------- | ----------------------------- | ------------------------------- |
| `upNext.get`    | Query    | None                          | Ordered queue with periods      |
| `upNext.add`    | Mutation | `{ bookId }`                  | Book appended                   |
| `upNext.remove` | Mutation | `{ bookId }`                  | Book removed, order rewritten   |
| `upNext.move`   | Mutation | `{ bookId, direction }`       | Book swapped up or down         |

The queue holds at most five books. `add` rejects a full queue with `BAD_REQUEST` `UP_NEXT_FULL`
and a book whose current status is not To Read with `BAD_REQUEST` `NOT_TO_READ`.

## `bookMetadata.*`

Every book metadata procedure is protected. Open Library requests run on the server.

| Procedure                        | Kind  | Input                | Result                      |
| -------------------------------- | ----- | -------------------- | --------------------------- |
| `bookMetadata.searchOpenLibrary` | Query | `{ title, author? }` | Up to 15 normalized matches |
| `bookMetadata.searchCatalog`     | Query | `{ query }`          | Up to 15 catalog matches    |

A title is required and the author is optional. Search uses Open Library relevance matching, then
ranks exact and near-exact title and author matches ahead of weaker results. Up to 15 distinct
matches with covers are returned. Returned fields include explicit Open Library work and edition
IDs, cover ID, title, authors, publication years, available ISBNs, and a derived cover preview URL.

Catalog search accepts a title, author, or ISBN. It returns matching works or editions with
available authors, publication years, page count, ISBNs, and an optional cover ID. Results without
covers remain available for metadata prefill.

## `dataTransfer.*`

Both procedures are protected and user-scoped.

| Procedure                             | Kind     | Purpose                                       |
| ------------------------------------- | -------- | --------------------------------------------- |
| `dataTransfer.previewGoodreadsImport` | Mutation | Parse and classify a Goodreads CSV            |
| `dataTransfer.importGoodreads`        | Mutation | Atomically import selected and corrected rows |

CSV uploads are limited to 5 MiB and 10,000 records. Previously imported Goodreads IDs are always
skipped. Likely duplicates require an explicit separate-edition choice. Import writes books,
current reading periods, tags from user shelves, and provenance in one transaction. Exclusive
shelves map to reading states; every other shelf becomes a tag.

## `releases.*`

| Procedure           | Kind     | Purpose                                        |
| ------------------- | -------- | ---------------------------------------------- |
| `releases.unseen`   | Query    | Return manifest entries newer than the marker |
| `releases.markSeen` | Mutation | Mark the server-selected current version seen |

Both procedures are protected. The marker follows the account across devices.

## `auth.*`

| Procedure                    | Access    | Kind     | Purpose                                            |
| ---------------------------- | --------- | -------- | -------------------------------------------------- |
| `auth.register`              | Public    | Mutation | Create a credentials account and send verification |
| `auth.verifyCredentials`     | Public    | Mutation | Validate credentials for Auth.js                   |
| `auth.requestPasswordReset`  | Public    | Mutation | Send a rate-limited password reset link            |
| `auth.validateResetToken`    | Public    | Query    | Check reset link validity                          |
| `auth.resetPassword`         | Public    | Mutation | Set a new password and invalidate reset links      |
| `auth.sendVerificationEmail` | Public    | Mutation | Send a rate-limited verification link              |
| `auth.verifyEmail`           | Public    | Mutation | Verify email and invalidate verification links     |
| `auth.updateName`            | Protected | Mutation | Update display name                                |
| `auth.updateEmail`           | Protected | Mutation | Confirm password, change email, and request verify |
| `auth.updatePassword`        | Protected | Mutation | Confirm current password and set a new one         |
| `auth.deleteAccount`         | Protected | Mutation | Confirm password and cascade-delete the account    |

Reset and verification requests are limited to three per user per hour. Responses for unknown
emails do not reveal whether an account exists.

Common error codes:

- `BAD_REQUEST` - invalid input, expired link, or invalid account state
- `UNAUTHORIZED` - missing session or wrong credentials
- `FORBIDDEN` - unverified account book limit
- `NOT_FOUND` - missing or unowned record
- `CONFLICT` - duplicate email
- `TOO_MANY_REQUESTS` - reset or verification rate limit
- `INTERNAL_SERVER_ERROR` - unexpected persistence or email failure
