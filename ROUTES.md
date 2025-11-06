# Quillify API Routes (tRPC + TanStack Query)

This document enumerates the current tRPC procedures, their HTTP transport endpoint, and expected status codes. It also proposes a TBD RESTful surface for `books` based on the Drizzle schema.

Key files:
- App router: `src/server/api/root.ts`
- tRPC context/procedures: `src/server/api/trpc.ts`
- Books router: `src/server/api/routers/books.ts`
- Auth router: `src/server/api/routers/auth.ts`
- tRPC HTTP handler (Next.js route): `src/app/api/trpc/[trpc]/route.ts`
- tRPC + TanStack Query clients:
  - React Query + tRPC client: `src/trpc/react.tsx`
  - RSC caller + hydration helpers: `src/trpc/server.ts`
  - React Query config: `src/trpc/query-client.ts`
- Drizzle schema (for reference): `src/server/db/schema.ts`

## Transport

- HTTP endpoint: `/api/trpc` (supports GET and POST in the route handler)
  - Implemented in `src/app/api/trpc/[trpc]/route.ts`
  - Clients in this app send POST requests via `httpBatchStreamLink` (see `src/trpc/react.tsx`).
  - Serialization: SuperJSON end-to-end.
- Success responses from tRPC are HTTP 200 OK by default (even for “create/update/delete” mutations).
- Errors use tRPC error codes mapped to HTTP status:
  - BAD_REQUEST → 400
  - UNAUTHORIZED → 401
  - FORBIDDEN → 403
  - NOT_FOUND → 404
  - CONFLICT → 409
  - INTERNAL_SERVER_ERROR → 500

Note: Protected procedures require an authenticated session (`protectedProcedure` in `src/server/api/trpc.ts`). Missing auth yields 401.

---

## Routers and Procedures

App router registrations:
- `books: booksRouter` - `src/server/api/routers/books.ts`
- `auth: authRouter` - `src/server/api/routers/auth.ts`
- Declared in `src/server/api/root.ts`

### books router (protected)

File: `src/server/api/routers/books.ts`
tRPC path prefix: `books.*`
All procedures are protected and require a valid session.

1) books.list (query)
- Purpose: List the current user's books, optionally filtered by read status.
- Input (optional): `{ isRead?: boolean }`
- Success:
  - 200 OK - Returns an array of the user's books (ordered by `createdAt` desc).
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.

2) books.create (mutation)
- Purpose: Create a new book for the current user.
- Input (required):
  - `title: string`
  - `author: string`
  - `numberOfPages: number (int, > 0)`
  - `genre?: string`
  - `publishYear?: number (int)`
- Success:
  - 200 OK - Returns the inserted book row.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.

3) books.update (mutation)
- Purpose: Update selected fields of a book owned by the current user.
- Input (required):
  - `id: string`
  - Optional fields: `title?: string`, `author?: string`, `numberOfPages?: number (int, > 0)`, `genre?: string | null`, `publishYear?: number | null`
- Success:
  - 200 OK - Returns the updated book row.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

4) books.setRead (mutation)
- Purpose: Set/toggle the read status of a book owned by the current user.
- Input (required): `{ id: string, isRead: boolean }`
- Success:
  - 200 OK - Returns the updated book row.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

5) books.remove (mutation)
- Purpose: Delete a book owned by the current user.
- Input (required): `{ id: string }`
- Success:
  - 200 OK - Returns `{ id: string }` of the removed book.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

Schema reference (for context): `src/server/db/schema.ts` → `books` table
Fields: `id`, `userId`, `title`, `author`, `numberOfPages`, `genre?`, `publishYear?`, `isRead (default false)`, `createdAt`.

---

### Auth router

File: `src/server/api/routers/auth.ts`
tRPC path prefix: `auth.*`

1) auth.register (mutation)
- Purpose: Register a new user with email/password.
- Input (required):
  - `email: string (email)`
  - `password: string (>= 8 chars, 1 upper, 1 lower, 1 number)`
  - `name?: string (>= 2 chars)`
- Success:
  - 200 OK - Returns `{ success: true, user: { id, email, name } }`.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 409 CONFLICT - Email already exists.
  - 500 INTERNAL_SERVER_ERROR - Unexpected error during creation.

2) auth.verifyCredentials (mutation)
- Purpose: Verify email/password (used by NextAuth credentials flow).
- Input (required): `{ email: string (email), password: string }`
- Success:
  - 200 OK - Returns the user without password (`{ id, email, name, emailVerified, image }`).
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 400 BAD_REQUEST - Account uses a different sign-in method (no stored password).
  - 401 UNAUTHORIZED - Invalid email or password.

3) auth.checkEmail (query)
- Purpose: Check if an email is registered.
- Input (required): `{ email: string (email) }`
- Success:
  - 200 OK - Returns `{ exists: boolean }`.
- Errors:
  - 400 BAD_REQUEST - Validation error.

---

## Client Usage Notes

- React (client) calls use `@trpc/react-query` with `httpBatchStreamLink` to `/api/trpc` and are configured in:
  - `src/trpc/react.tsx` (provider + client)
  - `src/trpc/query-client.ts` (retry and SuperJSON hydration settings)
- RSC calls use a typed caller via:
  - `src/trpc/server.ts` (RSC `api` and `HydrateClient`)

Both clients set the `x-trpc-source` header for tracing.

---

## TBD
### Books Routes

These are WIP endpoints that mirror the existing tRPC `books` procedures and the `books` table in `src/server/db/schema.ts`. When implemented, they should be protected (require auth) and enforce ownership on all item-specific routes.

- GET `/api/books`
  - Purpose: List current user's books; optionally filter by `?isRead=true|false`.
  - Success: 200 OK
  - Errors: 401 UNAUTHORIZED

- POST `/api/books`
  - Purpose: Create a new book.
  - Body: `{ title: string, author: string, numberOfPages: number, genre?: string, publishYear?: number }`
  - Success: 201 CREATED (returns created resource)
  - Errors: 400 BAD_REQUEST, 401 UNAUTHORIZED

- GET `/api/books/:id`
  - Purpose: Get a book by ID (must belong to current user).
  - Success: 200 OK
  - Errors: 401 UNAUTHORIZED, 404 NOT_FOUND

- PATCH `/api/books/:id`
  - Purpose: Update selected fields on a book.
  - Body: Any subset of `{ title, author, numberOfPages, genre, publishYear }`
  - Success: 200 OK
  - Errors: 400 BAD_REQUEST, 401 UNAUTHORIZED, 404 NOT_FOUND

- PATCH `/api/books/:id/read`
  - Purpose: Set/toggle read status.
  - Body: `{ isRead: boolean }`
  - Success: 200 OK
  - Errors: 400 BAD_REQUEST, 401 UNAUTHORIZED, 404 NOT_FOUND

- DELETE `/api/books/:id`
  - Purpose: Delete a book by ID.
  - Success: 204 NO_CONTENT
  - Errors: 401 UNAUTHORIZED, 404 NOT_FOUND

Status codes above reflect conventional REST semantics (201/204) rather than tRPC’s default 200 for successes.
