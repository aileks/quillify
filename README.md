# Quillify

Digitize your TBR lists and track your library.

![Quillify Screenshot](./docs/showcase.png)

## Motivation

Quillify bridges the gap between physical "to-be-read" (TBR) lists and modern digital book catalogs. While many of us maintain paper lists or scattered notes (paper or digital) of books we want to read, there's a unique problem: most existing book tracking apps focus on logging books you've already read, not managing your reading wishlist. Quillify solves this by providing a dedicated space to digitize your TBR list, organize it by genre, and seamlessly transition books from your wishlist to your read history all in one place, without getting in the way.

## Features

- **Comprehensive Book Cataloging**: Add and manage books with details like title, author, genre, publication year, and number of pages.
- **Reading Progress Tracking**: Mark books as read or unread, providing a clear overview of reading status.
- **Advanced Search and Filtering**: Quickly find books by title, author, genre, or read status.
- **Detailed Reading Statistics**: Gain insights into reading habits with stats on total books, pages read, average book length, and publication year range.
- **Genre Analysis**: Identify top genres within your library.
- **Recently Added Books**: View a curated list of recently added books.
- **User Authentication**: Secure user accounts with email/password authentication via NextAuth.js.
- **Password Reset**: Forgot password flow with secure email-based reset tokens (30-minute expiration, rate limiting).
- **Responsive Design**: Fully adaptive interface that works across all devices.
- **Type-Safe API**: tRPC ensures end-to-end type safety between the client and server.
- **Optimistic UI Updates**: Enhances user experience with instant feedback for actions like toggling read status.
- **Prefetching for Instant Navigation**: Data is prefetched on hover/focus for a fluid navigation experience.
- **Customizable Sidebar**: Adjustable sidebar width for personalized layout.

## Usage

### Authenticated Users

Once logged in, users are presented with a personalized dashboard showing key reading statistics and recently added books. The main "Library Catalog" page allows users to view, search, filter, and sort their book collection. Users can add new books, view detailed information about individual books, edit their details, and toggle their read status.

### Unauthenticated Users

Unauthenticated users see a landing page that showcases the application's features. They are prompted to register or log in to access the full functionality of the library management system.

## Getting Started

### Prerequisites

- Node.js 21+ and pnpm
- PostgreSQL database

### Quick Start

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/aileks/quillify.git
    cd quillify
    ```

2.  **Install dependencies**:

    ```bash
    pnpm install
    ```

3.  **Set up environment variables**:
    Copy the example environment file and update the values:

    ```bash
    cp .env.example .env
    ```

    Then edit `.env` with your actual values:

    ```env
    AUTH_SECRET=your_auth_secret_key_here
    DATABASE_URL=postgresql://postgres:@localhost:5432/postgres
    NEXT_AUTH_URL=http://localhost:3000
    MAIL_FROM_ADDRESS=your_mail_from_address_here
    MAIL_FROM_NAME=Quillify
    MAILTRAP_API_KEY=your_mailtrap_api_key_here
    NEXT_PUBLIC_APP_URL=http://localhost:3000/
    CRON_SECRET=your_cron_secret_here
    ```

    To generate secure secrets, run:

    ```bash
    openssl rand -base64 32
    ```

4.  **Set up the database**:
    Run the database migrations to create the necessary tables:

    ```bash
    pnpm db:generate
    pnpm db:migrate
    ```

5.  **(Optional) Seed with demo data**:
    To populate your database with sample data for testing or demonstration purposes:
    ```bash
    pnpm db:seed
    ```
    This will create a demo user (`demo@quillify.com` / `demo123`) with 15 books across various genres.

### Development

To start the development server:

```bash
pnpm dev
```

Open your browser to [http://localhost:3000](http://localhost:3000).

### Available Scripts

- `pnpm dev`: Start the development server with Hot Module Replacement (HMR).
- `pnpm build`: Build the optimized production version of the application.
- `pnpm start`: Start the production server.
- `pnpm db:generate`: Generate SQL migration files based on schema changes.
- `pnpm db:migrate`: Apply database migrations.
- `pnpm db:push`: Push schema changes directly to the database (development only).
- `pnpm db:studio`: Launch Drizzle Studio, a web-based GUI for interacting with your database.
- `pnpm db:seed`: Run a script to populate the database with seed data.
- `pnpm lint`: Check code quality using ESLint.
- `pnpm lint:fix`: Automatically fix linting issues.
- `pnpm format:check`: Verify code formatting against Prettier rules.
- `pnpm format:write`: Format code automatically with Prettier.

## Technologies Used

- **Next.js 16 (App Router)**: A React framework for building server-rendered applications with React Server Components.
- **React 19**: The JavaScript library for building user interfaces.
- **TypeScript**: A statically typed superset of JavaScript, used for enhanced code quality and maintainability.
- **tRPC v11**: A TypeScript-based RPC (Remote Procedure Call) framework that enables type-safe APIs between client and server without code generation.
- **TanStack Query (f.k.a. React Query)**: A powerful data-fetching and state management library for React, used here in conjunction with tRPC for client-side caching and synchronization.
- **PostgreSQL**: A robust open-source relational database system used for storing application data.
- **Drizzle ORM**: A lightweight SQL Object-Relational Mapper for TypeScript, used to define the database schema and interact with PostgreSQL.
- **NextAuth.js v5**: An authentication solution for Next.js applications, providing secure user authentication and session management.
- **Tailwind CSS v4**: A utility-first CSS framework for rapidly building custom designs.
- **shadcn/ui**: A collection of reusable UI components built with Radix UI and Tailwind CSS, offering a customizable and accessible component library.
- **Zod**: A TypeScript-first schema declaration and validation library, used for runtime data validation in tRPC procedures and form handling.
- **SuperJSON**: A library for serializing and deserializing JSON with support for more complex types like Dates, Maps, and Sets, used with tRPC for efficient data transfer.
- **bcryptjs**: A library for hashing passwords securely.

## Configuration

Environment variables are managed via a `.env` file in the project root. See `.env.example` for a template. Key variables include:

- `AUTH_SECRET`: A secret key used for signing NextAuth.js session tokens.
- `DATABASE_URL`: The connection string for your PostgreSQL database.
- `NEXT_AUTH_URL`: The base URL of your application (e.g., `http://localhost:3000`).
- `MAILTRAP_API_KEY`: API key for Mailtrap email service (used for password reset emails).
- `MAIL_FROM_ADDRESS`: The email address used as the sender for outgoing emails.
- `MAIL_FROM_NAME`: The display name for outgoing emails.
- `NEXT_PUBLIC_APP_URL`: The public URL of your application (used for email links).
- `CRON_SECRET`: Secret key for authenticating Vercel cron job requests.

Database schema and migrations are handled by Drizzle Kit. Configuration files for Drizzle Kit can be found in `drizzle.config.ts`.

## API Documentation

Quillify utilizes tRPC v11 for its API layer, offering type-safe client-server communication.

Two primary tRPC clients are used:

1.  **Server-side (RSC)**:
    - **Import**: `import { api } from '@/trpc/server'`
    - Uses `createCaller` for direct server-to-server calls.
    - No React Query wrapper is needed for server components.
    - Defined in `src/trpc/server.ts`.

    **Example Usage**:

    ```typescript
    import { api } from '@/trpc/server';

    export default async function BooksPage() {
      const books = await api.books.list();
      return <BookList books={books} />;
    }
    ```

2.  **Client-side (Tanstack Query)**:
    - **Import**: `import { api } from '@/trpc/react'`
    - Provides React hooks (e.g., `useQuery`, `useMutation`).
    - Requires a `TRPCReactProvider` wrapper in the component tree.
    - Handles automatic caching and optimistic updates.
    - Defined in `src/trpc/react.tsx`.

    **Example Usage**:

    ```typescript
    'use client';
    import { api } from '@/trpc/react';

    export function BookList() {
      const { data: books } = api.books.list.useQuery();
      const deleteMutation = api.books.remove.useMutation();
      // ...
    }
    ```

tRPC procedures are categorized into `publicProcedure` (accessible to all) and `protectedProcedure` (requiring authentication).

- **`publicProcedure`**: For endpoints like user registration or retrieving public data.
- **`protectedProcedure`**: For endpoints that require a valid user session, such as accessing or modifying user-specific book data. Session data is available via `ctx.session.user`.

- **Timing Middleware**: All tRPC procedures include middleware to log execution duration, aiding in performance monitoring.
- **Authentication Middleware**: `protectedProcedure` automatically throws a 401 UNAUTHORIZED error if the user is not authenticated.

Routers are organized by feature in `src/server/api/routers/` (e.g., `booksRouter`, `authRouter`) and composed in `src/server/api/root.ts`.

For detailed endpoint documentation, including inputs, outputs, and status codes, refer to the [ROUTES.md](./docs/ROUTES.md) file.

The tRPC context (`ctx`) is created per request and includes:

- `db`: An instance of the Drizzle database client.
- `session`: The NextAuth.js session object (null if not authenticated).

tRPC errors are mapped to standard HTTP status codes. Zod validation errors are flattened for typed client-side error handling.

- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_SERVER_ERROR` (500)

- **HTTP Endpoint**: `/api/trpc/[trpc]`
- **Method**: POST (via `httpBatchStreamLink`)
- **Serialization**: SuperJSON for end-to-end serialization of complex types.
- **Batching**: Enabled for efficient parallel query execution.
- **Headers**: Clients set `x-trpc-source` header for request tracing.

For a more detailed breakdown, refer to [API.md](./docs/API.md) and [ROUTES.md](./docs/ROUTES.md)

## Database Schema

The database schema is defined using Drizzle ORM in `src/server/db/schema.ts` and managed with Drizzle Kit migrations located in `src/server/drizzle/`.

### Tables

- **`users`**: Stores user account information, including ID, name, email, and password hash. The password field is nullable to support future OAuth providers.
- **`books`**: Stores book entries linked to users, containing details such as title, author, page count, genre, publication year, and read status.
- **`password_reset_tokens`**: Stores password reset tokens with expiration timestamps, linked to users for secure password recovery.

For a detailed schema description, refer to [SCHEMA.md](./docs/SCHEMA.md).

## Dependencies

The project utilizes a range of libraries for its functionality. Key dependencies include:

- `next`: React framework.
- `react`: React 19 itself.
- `react-dom`: React bindings for the DOM.
- `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@trpc/tanstack-react-query`: tRPC core and React integration.
- `@tanstack/react-query`: Data fetching and state management.
- `next-auth`: Authentication library.
- `drizzle-orm`: SQL ORM.
- `zod`: Schema validation.
- `bcryptjs`: Password hashing.
- `mailtrap`: Official Mailtrap SDK for sending transactional emails (password reset).
- `tailwindcss`, `class-variance-authority`, `tailwind-merge`: Styling and component utilities.
- `shadcn/ui` components (via direct import): UI component library.
- `lucide-react`: Icon library.
- `sonner`: Toast notifications.
- `superjson`: Data serialization.

A complete list of dependencies can be found in the `package.json` file.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -am 'Add YourFeature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Create a new Pull Request.

Please ensure your code adheres to the project's coding style and passes all linting and formatting checks.

## Testing

Automated testing is not explicitly configured or detailed in the provided codebase. However, the use of tRPC and Zod promotes robust application logic that can be further enhanced with unit and integration tests.

## License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](./LICENSE) file for more details.

---

- **[API.md](./docs/API.md)**: Detailed API architecture and tRPC setup.
- **[ROUTES.md](./docs/ROUTES.md)**: Comprehensive list of tRPC procedures and their endpoints.
- **[SCHEMA.md](./docs/SCHEMA.md)**: Database schema documentation.

_README.md was made with [Etchr](https://etchr.dev)_
