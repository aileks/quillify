# Quillify API Architecture

This document describes the API layer architecture and tRPC setup used in Quillify.

For detailed endpoint documentation, see [ROUTES.md](./ROUTES.md).

## Overview

Quillify uses [tRPC v11](https://trpc.io/) for type-safe client-server communication, providing automatic type inference from server to client without code generation.

## tRPC Setup

Quillify uses two tRPC clients for different contexts:

### 1. Server-side (RSC)

**Import**: `import { api } from '@/trpc/server'`

- Uses `createCaller` for direct server-to-server calls
- No React Query wrapper needed
- Ideal for Server Components
- Defined in `src/trpc/server.ts`

**Example usage**:
```typescript
import { api } from '@/trpc/server';

export default async function BooksPage() {
  const books = await api.books.list();
  return <BookList books={books} />;
}
```

### 2. Client-side (React Query)

**Import**: `import { api } from '@/trpc/react'`

- Provides React hooks (`useQuery`, `useMutation`)
- Requires `TRPCReactProvider` wrapper in component tree
- Automatic caching and optimistic updates
- Defined in `src/trpc/react.tsx`

**Example usage**:
```typescript
'use client';
import { api } from '@/trpc/react';

export function BookList() {
  const { data: books } = api.books.list.useQuery();
  const deleteMutation = api.books.remove.useMutation();
  // ...
}
```

## Procedures

All tRPC procedures are defined in `src/server/api/trpc.ts` and organized into feature-specific routers in `src/server/api/routers/`.

### Public Procedures

**Base**: `publicProcedure`

- Open endpoints accessible without authentication
- Example use cases: login, registration, public data

### Protected Procedures

**Base**: `protectedProcedure`

- Require valid user authentication
- Session data available in `ctx.session.user`
- Automatically returns 401 UNAUTHORIZED if not authenticated

**Example**:
```typescript
export const booksRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ isRead: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      // ctx.session.user is guaranteed to exist
      const userId = ctx.session.user.id;
      // ...
    }),
});
```

## Middleware

Both procedure types include timing middleware for performance monitoring, which logs execution duration:

```
[TRPC] books.list took 45ms
```

## Router Organization

Routers are organized by feature in `src/server/api/routers/` and composed in `src/server/api/root.ts`:

```typescript
export const appRouter = createTRPCRouter({
  books: booksRouter,    // src/server/api/routers/books.ts
  auth: authRouter,      // src/server/api/routers/auth.ts
});
```

See [ROUTES.md](./ROUTES.md) for a complete list of available procedures and their endpoints.

## Context

The tRPC context (`ctx`) is created per-request and includes:

- `db`: Drizzle database instance
- `session`: NextAuth session (null if not authenticated)

Context is defined in `src/server/api/trpc.ts` and populated via `auth()` from NextAuth v5.

## Error Handling

### Error Formatting

Zod validation errors are automatically flattened for typed client errors via `errorFormatter` in `src/server/api/trpc.ts`.

### HTTP Status Codes

tRPC errors map to standard HTTP status codes:

- `BAD_REQUEST` → 400
- `UNAUTHORIZED` → 401
- `FORBIDDEN` → 403
- `NOT_FOUND` → 404
- `CONFLICT` → 409
- `INTERNAL_SERVER_ERROR` → 500

Success responses default to HTTP 200 OK (even for mutations).

## Transport

- **HTTP endpoint**: `/api/trpc/[trpc]`
- **Method**: POST (via `httpBatchStreamLink`)
- **Serialization**: SuperJSON end-to-end for complex types (Date, Map, Set, etc.)
- **Batching**: Enabled for multiple parallel queries
- **Headers**: Both clients set `x-trpc-source` header for request tracing

## Adding New Endpoints

1. **Create or update a router** in `src/server/api/routers/`
2. **Define the procedure** using `publicProcedure` or `protectedProcedure`
3. **Register the router** in `src/server/api/root.ts`
4. **Use from RSC** via `import { api } from '@/trpc/server'`
5. **Use from client** via `import { api } from '@/trpc/react'` (requires `TRPCReactProvider`)

## Related Files

- `src/server/api/trpc.ts` - Context, procedures, middleware, error formatting
- `src/server/api/root.ts` - Main app router composition
- `src/server/api/routers/*` - Feature-specific routers
- `src/trpc/server.ts` - RSC caller and hydration helpers
- `src/trpc/react.tsx` - React Query + tRPC client and provider
- `src/trpc/query-client.ts` - React Query configuration
- `src/app/api/trpc/[trpc]/route.ts` - Next.js API route handler
- [ROUTES.md](./ROUTES.md) - Complete endpoint documentation