# Quillify

Digitize your TBR lists and track your library.

![Quillify Screenshot](./docs/showcase.png)

## Architecture

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with React 19
- **Language**: TypeScript for complete type safety
- **API Layer**: [tRPC v11](https://trpc.io/) with [TanStack Query](https://tanstack.com/query/latest) for type-safe client<->server communication
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
│   ├── server.ts          # Server-side tRPC caller (RSC)
│   └── query-client.ts    # React Query configuration
└── styles/
    └── globals.css        # Global styles & theme variables
```

### Key Design Patterns

- **Server Components First**: Leveraging React Server Components for optimal performance
- **Progressive Enhancement**: Client-side interactivity layered on top of SSR
- **Type-Safe APIs**: tRPC provides automatic type inference from server to client
- **Database Schema as Source of Truth**: Drizzle generates types from schema definitions
- **Modular Routing**: Feature-based tRPC routers for better organization
- **Protected Procedures**: Auth-guarded endpoints ensure secure data access

## Getting Started

### Prerequisites

- Node.js 21+ and pnpm
- PostgreSQL database

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/aileks/quillify.git
cd quillify
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
NEXTAUTH_URL="http://localhost:3000"
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

This creates a demo user with 15 books across various genres.

### Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `pnpm dev`: Start development server with Turbo
- `pnpm build`: Build production bundle
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint
- `pnpm format:check`: Check code formatting
- `pnpm format:write`: Format code with Prettier
- `pnpm db:generate`: Generate migration files from schema
- `pnpm db:migrate`: Apply migrations to database
- `pnpm db:push`: Push schema changes directly (dev only)
- `pnpm db:studio`: Open Drizzle Studio (database GUI)

## Docs

- **[API.md](./docs/API.md)**: API architecture, tRPC setup, and client usage patterns
- **[ROUTES.md](./docs/ROUTES.md)**: Complete list of tRPC procedures and endpoints
- **[SCHEMA.md](./docs/SCHEMA.md)**: Database schema documentation with tables, relationships, and constraints
