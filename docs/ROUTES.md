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
| `/account/settings`        | Protected | Update name, email, password, or delete the account |
| `/books`                   | Protected | Browse, search, filter, sort, select, and paginate  |
| `/books/new`               | Protected | Add a book                                          |
| `/books/[id]`              | Protected | View, edit, track, reread, or delete a book         |

Protected `/books` routes are enforced in `src/app/books/layout.tsx`. Account settings performs its
own server redirect.

## API routes

| Route                      | Method | Purpose                                          |
| -------------------------- | ------ | ------------------------------------------------ |
| `/api/auth/[...nextauth]`  | Any    | Auth.js handlers                                 |
| `/api/trpc/[trpc]`         | POST   | Batched tRPC transport                           |
| `/api/verify-email`        | GET    | Consume a verification token and redirect        |
| `/api/cron/cleanup-tokens` | GET    | Remove expired reset and verification token rows |

The cron route requires `Authorization: Bearer <CRON_SECRET>`.

## `books.*`

Every books procedure is protected.

| Procedure                   | Kind     | Input                                             | Result                                  |
| --------------------------- | -------- | ------------------------------------------------- | --------------------------------------- |
| `books.stats`               | Query    | None                                              | Library, lifecycle, and reading totals  |
| `books.list`                | Query    | Search, status, genres, sort, page, page size     | Paginated books with current periods    |
| `books.getById`             | Query    | `{ id }`                                          | Owned book, current period, and history |
| `books.create`              | Mutation | Book, ownership, optional initial reading details | Created book and current period         |
| `books.update`              | Mutation | `{ id }` plus editable metadata and ownership     | Updated owned book                      |
| `books.transitionStatus`    | Mutation | Book ID, next status, format, and optional dates  | Updated or new current period           |
| `books.updateReadingPeriod` | Mutation | Period ID, outcome, format, and optional dates    | Corrected owned period                  |
| `books.remove`              | Mutation | `{ id }`                                          | Removed ID                              |
| `books.removeMany`          | Mutation | `{ ids }`, 1-100 unique IDs                       | Atomically removed IDs                  |

`books.list` defaults to page 1 and 12 rows. The UI always requests 12. Search covers title,
author, and genre. The server clamps pages beyond the last available page.

Every current period can move directly to any reading status. Active periods and completed-outcome
corrections change in place. Moving from Finished or Did Not Finish to To Read, Reading, or Paused
creates a new current period and preserves the old one. Calendar dates are optional, cannot be in
the future, and must remain ordered. Historical corrections can switch only between Finished and
Did Not Finish outcomes.

Shared book validation limits:

- title: 1-200 characters
- author: 1-120 characters
- genre: at most 80 characters
- pages: 1-100,000
- publication year: 1000 through five years after the current year

Unverified accounts can hold up to 10 books.

## `bookMetadata.*`

Every book metadata procedure is protected. Open Library requests run on the server.

| Procedure                        | Kind  | Input                | Result                      |
| -------------------------------- | ----- | -------------------- | --------------------------- |
| `bookMetadata.searchOpenLibrary` | Query | `{ title, author? }` | Up to 15 normalized matches |
| `bookMetadata.searchCatalog`     | Query | `{ query }`          | Up to 15 catalog matches    |

A title is required and the author is optional. Search uses Open Library relevance matching, then
ranks exact and near-exact title and author matches ahead of weaker results. Up to 15 distinct
matches with covers are returned. Returned fields include an Open Library identifier, cover ID,
title, authors, publication years, available ISBNs, and a derived cover preview URL.

Catalog search accepts a title, author, or ISBN. It returns matching works or editions with
available authors, publication years, page count, ISBNs, and an optional cover ID. Results without
covers remain available for metadata prefill.

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
