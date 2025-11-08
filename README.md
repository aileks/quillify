# Quillify

Stack

- TypeScript end-to-end
- Next.js (App Router)
- Drizzle ORM
- tRPC w/ TanStack Query
- shadcn/ui

## Getting Started

### Database Setup

1. Set up your database and run migrations:

```bash
pnpm db:migrate
```

2. (Optional) Seed the database with demo data:

```bash
pnpm db:seed
```

This creates a demo user with 15 books across various genres.

### Start Development Server

```bash
pnpm run dev
```

Open http://localhost:3000 in your browser.
