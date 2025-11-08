# Quillify

A modern, full-stack book tracking application built with Next.js 16.

![Quillify Screenshot](./docs/screenshot.png)

## Features

- **Personal Library Management** – Track your reading list with detailed book information
- **Reading Progress** – Mark books as read/unread and monitor your reading journey
- **Secure Authentication** – Protected user accounts with NextAuth v5
- **Responsive Design** – Beautiful UI that works seamlessly across all devices
- **Type-Safe API** – End-to-end type safety from database to UI

## Architecture

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with React 19
- **Language**: TypeScript for complete type safety
- **API Layer**: [tRPC v11](https://trpc.io/) with React Query for type-safe client-server communication
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth v5](https://authjs.dev/) with DrizzleAdapter
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS-first theming
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) components with Tailwind CSS
- **Validation**: [Zod](https://zod.dev/) for runtime schema validation

### Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── account/           # Authentication pages (login, register)
│   ├── books/             # Book management pages
│   └── api/               # API routes (NextAuth)
├── components/
│   └── ui/                # shadcn/ui components
├── server/
│   ├── api/               # tRPC router definitions
│   │   ├── routers/       # Feature-specific routers
│   │   ├── root.ts        # Main app router
│   │   └── trpc.ts        # tRPC context & procedures
│   ├── auth/              # NextAuth configuration
│   └── db/                # Database schema & connection
├── trpc/
│   ├── react.tsx          # Client-side tRPC hooks
│   └── server.ts          # Server-side tRPC caller (RSC)
└── styles/
    └── globals.css        # Global styles & theme variables
```

### Key Design Patterns

- **Server Components First** – Leveraging React Server Components for optimal performance
- **Progressive Enhancement** – Client-side interactivity layered on top of SSR
- **Type-Safe APIs** – tRPC provides automatic type inference from server to client
- **Database Schema as Source of Truth** – Drizzle generates types from schema definitions
- **Modular Routing** – Feature-based tRPC routers for better organization
- **Protected Procedures** – Auth-guarded endpoints ensure secure data access

## Getting Started

### Prerequisites

- Node.js 21+ and pnpm
- PostgreSQL database

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/quillify.git
cd quillify
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/quillify"
AUTH_SECRET="your-secret-key-here"
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. **Set up the database**

Run migrations to create the database schema:

```bash
pnpm db:generate
pnpm db:migrate
```

5. **(Optional) Seed with demo data**

```bash
pnpm db:seed
```

This creates a demo user with 15 books across various genres:
- **Email**: demo@quillify.com
- **Password**: demo123

### Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `pnpm dev` – Start development server with Turbo
- `pnpm build` – Build production bundle
- `pnpm start` – Start production server
- `pnpm lint` – Run ESLint
- `pnpm format:check` – Check code formatting
- `pnpm format:write` – Format code with Prettier
- `pnpm db:generate` – Generate migration files from schema
- `pnpm db:migrate` – Apply migrations to database
- `pnpm db:push` – Push schema changes directly (dev only)
- `pnpm db:studio` – Open Drizzle Studio (database GUI)

## API Architecture

### tRPC Setup

Quillify uses two tRPC clients:

1. **Server-side (RSC)**: `import { api } from '@/trpc/server'`
   - Uses `createCaller` for direct server-to-server calls
   - No React Query wrapper needed
   - Ideal for Server Components

2. **Client-side (React Query)**: `import { api } from '@/trpc/react'`
   - Provides React hooks (`useQuery`, `useMutation`)
   - Requires `TRPCReactProvider` wrapper
   - Automatic caching and optimistic updates

### Procedures

- **Public Procedures**: `publicProcedure` – Open endpoints (e.g., login)
- **Protected Procedures**: `protectedProcedure` – Require authentication

Both include timing middleware for performance monitoring.

## Database

### Schema

Tables are organized under the `quillify` PostgreSQL schema:

- **users** – User accounts with authentication
- **books** – Book entries linked to users
- **accounts** – OAuth account linkage (NextAuth)
- **sessions** – User session management (NextAuth)

All tables include `createdAt` and `updatedAt` timestamps with timezone support.

### Migrations

Drizzle Kit manages schema migrations. Configuration in `drizzle.config.ts`:

- Migration files: `src/server/drizzle/`
- Schema filter: `quillify` schema only

## Styling

The UI uses [shadcn/ui](https://ui.shadcn.com/) components with Tailwind CSS v4:

- **Accessible Components** – Pre-built components using Radix UI primitives
- **Customizable** – Full control over component styling and behavior
- **CSS Variables** – Theme customization with light/dark mode support
- **Type-Safe** – TypeScript definitions for all components

## Authentication

NextAuth v5 (beta) provides authentication with:

- Credentials provider (email/password)
- DrizzleAdapter for database session storage
- Protected routes via middleware
- Type-safe session management

Session data is injected into tRPC context for authenticated procedures.

## License

MIT License - feel free to use this project for learning or as a portfolio piece.

## Contributing

This is a personal portfolio project, but suggestions and feedback are welcome! Feel free to open an issue or submit a pull request.

---

Built by [Your Name](https://github.com/yourusername)
