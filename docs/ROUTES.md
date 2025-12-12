# Quillify Routes

This document enumerates the current app routes and tRPC procedures, their HTTP transport endpoint, and expected status codes.

## App Routes

### Public Routes

- `/` - Landing page / Dashboard
  - **Authenticated users**: See personalized dashboard with reading statistics and overview
  - **Unauthenticated users**: See marketing/landing page
- `/account/login` - User login page
  - **Authenticated users**: Automatically redirected to `/` (dashboard)
  - **After successful login**: Redirected to `/` (dashboard) or `callbackUrl` if provided
- `/account/register` - User registration page
  - **Authenticated users**: Automatically redirected to `/` (dashboard)
  - **After successful registration**: Redirected to `/` (dashboard) or `callbackUrl` if provided
- `/account/forgot-password` - Request password reset page
  - **Authenticated users**: Can still access (in case they want to reset password)
  - **After successful submission**: Shows confirmation message regardless of email existence (security)
- `/account/reset-password` - Reset password page (requires valid token)
  - **Query params**: `token` (required) - The reset token from email
  - **Invalid/expired token**: Shows error message with link to request new token

### Protected Routes (require authentication)

- `/books` - List all books for the current user (grid view)
  - **Unauthenticated users**: Redirected to `/` (landing page)
- `/books/new` - Create a new book form
  - **Unauthenticated users**: Redirected to `/` (landing page)
- `/books/[id]` - View and edit a specific book (details page)
  - **Unauthenticated users**: Handled by client-side (shows error/redirects via tRPC)
- `/account/settings` - User account settings page (email and password management)
  - **Unauthenticated users**: Redirected to `/account/login`

### API Routes

- `/api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `/api/trpc/[trpc]` - tRPC HTTP handler (all tRPC procedures)
- `/api/cron/cleanup-tokens` - Cron endpoint for cleaning expired password reset tokens
  - **Method**: GET
  - **Authorization**: Requires `Authorization: Bearer <CRON_SECRET>` header (Vercel cron)
  - **Schedule**: Daily at 3:00 AM UTC (configured in `vercel.json`)

### Authentication Flow

- **NextAuth sign-in page**: `/` (landing page with login/register CTAs)
- **Default redirect after login**: `/` (dashboard)
- **Default redirect after logout**: `/`
- **Unauthorized access**: Redirected to `/`

## tRPC API Routes

This section enumerates the current tRPC procedures, their HTTP transport endpoint, and expected status codes.

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

## Routers and Procedures

App router registrations:

- `books: booksRouter` - `src/server/api/routers/books.ts`
- `auth: authRouter` - `src/server/api/routers/auth.ts`
- Declared in `src/server/api/root.ts`

For transport details, error handling, and HTTP status codes, see [API.md](./API.md).

### books router (protected)

File: `src/server/api/routers/books.ts`
tRPC path prefix: `books.*`
All procedures are protected and require a valid session.

1. books.list (query)

- Purpose: List the current user's books with pagination, search, filtering, and sorting.
- Input (optional):
  - `isRead?: boolean` - Filter by read status
  - `search?: string` - Search across title, author, and genre fields (case-insensitive)
  - `sortBy?: 'title' | 'author' | 'createdAt'` - Sort column (default: 'title')
  - `sortOrder?: 'asc' | 'desc'` - Sort direction (default: 'asc')
  - `page?: number` - Page number (default: 1, must be positive)
  - `pageSize?: number` - Items per page (default: 12, max: 100, must be positive)
- Success:
  - 200 OK - Returns paginated result:
    ```typescript
    {
      items: Book[],
      totalCount: number,
      page: number,
      pageSize: number,
      totalPages: number
    }
    ```
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.

2. books.getById (query)

- Purpose: Get a single book by ID (must be owned by the current user).
- Input (required): `{ id: string }`
- Success:
  - 200 OK - Returns the book object.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

3. books.create (mutation)

- Purpose: Create a new book for the current user.
- Input (required):
  - `title: string` (min 1 char)
  - `author: string` (min 1 char)
  - `numberOfPages: number` (integer, > 0)
  - `genre?: string` (optional)
  - `publishYear: number` (integer, > 0)
- Success:
  - 200 OK - Returns the inserted book row.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.

4. books.update (mutation)

- Purpose: Update selected fields of a book owned by the current user.
- Input (required):
  - `id: string`
  - Optional fields:
    - `title?: string` (min 1 char if provided)
    - `author?: string` (min 1 char if provided)
    - `numberOfPages?: number` (integer, > 0 if provided)
    - `genre?: string | null` (null to clear, undefined to keep unchanged)
    - `publishYear?: number` (integer, > 0 if provided)
- Success:
  - 200 OK - Returns the updated book row.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

5. books.setRead (mutation)

- Purpose: Set/toggle the read status of a book owned by the current user.
- Input (required): `{ id: string, isRead: boolean }`
- Success:
  - 200 OK - Returns the updated book row.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

6. books.remove (mutation)

- Purpose: Delete a book owned by the current user.
- Input (required): `{ id: string }`
- Success:
  - 200 OK - Returns `{ id: string }` of the removed book.
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 401 UNAUTHORIZED - Not authenticated.
  - 404 NOT_FOUND - Book not found or not owned by the user.

Schema reference (for context): `src/server/db/schema.ts` → `books` table
Fields: `id`, `userId`, `title`, `author`, `numberOfPages`, `genre?` (default: 'Other'), `publishYear`, `isRead` (default: false), `createdAt`, `updatedAt`.

### Auth router

File: `src/server/api/routers/auth.ts`
tRPC path prefix: `auth.*`
Mix of public and protected procedures.

1. auth.register (mutation)

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

2. auth.verifyCredentials (mutation)

- Purpose: Verify email/password (used by NextAuth credentials flow).
- Input (required): `{ email: string (email), password: string }`
- Success:
  - 200 OK - Returns the user without password (`{ id, email, name, emailVerifiedAt }`).
- Errors:
  - 400 BAD_REQUEST - Validation error.
  - 400 BAD_REQUEST - Account uses a different sign-in method (no stored password).
  - 401 UNAUTHORIZED - Invalid email or password.

3. auth.checkEmail (query)

- Purpose: Check if an email is registered.
- Input (required): `{ email: string (email) }`
- Success:
  - 200 OK - Returns `{ exists: boolean }`.
- Errors:
  - 400 BAD_REQUEST - Validation error.

4. auth.updateEmail (mutation) - Protected

- Purpose: Update the current user's email address (requires password verification).
- Input (required):
  - `newEmail: string (email)` - New email address
  - `currentPassword: string` - Current password for verification
- Success:
  - 200 OK - Returns `{ success: true, message: 'Email updated successfully' }`.
- Errors:
  - 400 BAD_REQUEST - Validation error or account uses different sign-in method.
  - 401 UNAUTHORIZED - Not authenticated or current password is incorrect.
  - 404 NOT_FOUND - User not found.
  - 409 CONFLICT - Email already exists.
  - 500 INTERNAL_SERVER_ERROR - Failed to update email.

5. auth.updatePassword (mutation) - Protected

- Purpose: Update the current user's password (requires current password verification).
- Input (required):
  - `currentPassword: string` - Current password for verification
  - `newPassword: string` - New password (>= 8 chars, 1 upper, 1 lower, 1 number)
- Success:
  - 200 OK - Returns `{ success: true, message: 'Password updated successfully' }`.
- Errors:
  - 400 BAD_REQUEST - Validation error or account uses different sign-in method.
  - 401 UNAUTHORIZED - Not authenticated or current password is incorrect.
  - 404 NOT_FOUND - User not found.
  - 500 INTERNAL_SERVER_ERROR - Failed to update password.

6. auth.requestPasswordReset (mutation) - Public

- Purpose: Request a password reset email. Always returns success to prevent email enumeration.
- Input (required):
  - `email: string (email)` - Email address to send reset link to
- Success:
  - 200 OK - Returns `{ success: true, message: 'If an account exists...' }`.
- Errors:
  - 400 BAD_REQUEST - Validation error.
- Notes:
  - Rate limited to 3 requests per email per hour
  - Generates a secure token with 30-minute expiration
  - Sends styled HTML email via Mailtrap

7. auth.validateResetToken (query) - Public

- Purpose: Validate a password reset token before showing the reset form.
- Input (required):
  - `token: string` - The reset token from the email link
- Success:
  - 200 OK - Returns `{ valid: true, email: string }`.
- Errors:
  - 400 BAD_REQUEST - Invalid or expired token (returns `{ valid: false, message: '...' }`).
- Notes:
  - Also cleans up expired tokens on-demand during validation

8. auth.resetPassword (mutation) - Public

- Purpose: Reset user password using a valid reset token.
- Input (required):
  - `token: string` - The reset token from the email link
  - `password: string` - New password (>= 8 chars, 1 upper, 1 lower, 1 number)
- Success:
  - 200 OK - Returns `{ success: true, message: 'Password has been reset successfully' }`.
- Errors:
  - 400 BAD_REQUEST - Validation error, invalid token, or expired token.
  - 404 NOT_FOUND - User not found.
  - 500 INTERNAL_SERVER_ERROR - Failed to update password.
- Notes:
  - Deletes the token after successful use
  - Cleans up all expired tokens for the user

9. auth.cleanupExpiredTokens (mutation) - Public (but secured via cron)

- Purpose: Clean up all expired password reset tokens from the database.
- Input: None
- Success:
  - 200 OK - Returns `{ success: true, deleted: number }`.
- Notes:
  - Called by the `/api/cron/cleanup-tokens` endpoint
  - Runs daily via Vercel cron job

---

For detailed client setup and usage patterns, see [API.md](./API.md).
