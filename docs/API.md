# Quillify API Architecture

Quillify uses tRPC 11, SuperJSON, TanStack Query, Drizzle ORM, and Auth.js credentials sessions.
Procedure details are in [ROUTES.md](./ROUTES.md).

## Entry points

| Context          | Import             | Use                                          |
| ---------------- | ------------------ | -------------------------------------------- |
| Server Component | `@/trpc/server`    | RSC caller, prefetching, and `HydrateClient` |
| Client Component | `@/trpc/react`     | TanStack Query hooks and mutations           |
| HTTP             | `/api/trpc/[trpc]` | Batched tRPC transport                       |

Client code must import `AppRouter` with `import type`. A runtime import from
`src/server/api/root.ts` pulls PostgreSQL and Node.js modules into the browser bundle.

## Context and procedures

`src/server/api/trpc.ts` creates a request context containing:

- `db`: Drizzle PostgreSQL client
- `session`: Auth.js session or `null`
- request headers

`publicProcedure` is unauthenticated. `protectedProcedure` requires
`ctx.session.user`; otherwise it throws `UNAUTHORIZED`.

Inputs are validated with Zod. The error formatter exposes flattened Zod errors to typed clients.
Expected failures use `TRPCError`.

Book creation and reading-status transitions use database transactions so every book receives a
current reading period and rereads replace the current marker atomically. Book ownership is checked
before lifecycle history is returned or changed.

## Transport

- SuperJSON serializes dates and other non-JSON-native values
- Browser requests use `httpBatchStreamLink`
- Client requests set `x-trpc-source: nextjs-react`
- RSC calls set `x-trpc-source: rsc`
- TanStack Query caches prefetched and client-fetched data

## Authentication

Auth configuration lives in `src/server/auth/config.ts`.

- Credentials provider with JWT sessions
- Passwords are hashed with bcrypt
- Laravel `$2y$` hashes are normalized before verification
- Unverified users can sign in but are limited to 10 books
- "Remember me" selects a 30-day session; the default is one day
- Callback URLs are restricted to local paths

Password reset and verification links use 32 random bytes encoded as hex. Only a SHA-256 hash is
stored. Successful use invalidates every outstanding link of that type for the user.

## Route handlers

- `/api/auth/[...nextauth]` exposes Auth.js handlers
- `/api/verify-email` consumes an email verification link and redirects to a result screen
- `/api/cron/cleanup-tokens` removes expired reset and verification tokens
- `/api/trpc/[trpc]` serves tRPC requests

The cron route requires `Authorization: Bearer <CRON_SECRET>` and runs daily at 03:00 UTC from
`vercel.json`.

## Email

`src/lib/email.ts` sends Mailtrap transactional email. Templates live in
`src/lib/email-templates/`.

Required settings:

- `MAILTRAP_API_KEY`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`
- `NEXT_PUBLIC_APP_URL`

## Source map

- `src/server/api/root.ts` - app router composition
- `src/server/api/trpc.ts` - context, middleware, and procedure bases
- `src/server/api/routers/auth.ts` - account procedures
- `src/server/api/routers/books.ts` - library procedures
- `src/server/api/routers/book-metadata.ts` - authenticated metadata search
- `src/server/services/book-metadata/open-library.ts` - Open Library client and normalization
- `src/trpc/server.ts` - RSC caller and hydration
- `src/trpc/react.tsx` - browser provider and hooks
- `src/server/db/schema.ts` - Drizzle schema
