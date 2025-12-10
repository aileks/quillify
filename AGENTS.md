# AGENTS.md

## Commands

- `pnpm dev` - Start dev server | `pnpm build` - Production build | `pnpm lint` - ESLint
- `pnpm format:write` - Fix formatting | `pnpm format:check` - Check formatting
- `pnpm db:generate` - Generate migrations | `pnpm db:migrate` - Run migrations | `pnpm db:push` - Push schema
- No test framework configured

## Code Style

- **Imports**: External packages first, then internal with `@/` alias. Use `import type` for type-only imports
- **Formatting**: 2-space indent, single quotes, semicolons, 100 char line width, trailing commas (ES5)
- **Naming**: Files in kebab-case, components/types in PascalCase, functions/variables in camelCase
- **TypeScript**: Strict mode enabled, use `noUncheckedIndexedAccess` - always check array/object access

## Patterns

- Client components: Add `'use client';` directive. Server components are default (no directive)
- tRPC: Use `protectedProcedure` for auth routes, Zod for input validation, `TRPCError` for errors
- Forms: react-hook-form + Zod schemas with `@hookform/resolvers`
- Styling: Tailwind CSS with `cn()` utility from `@/lib/utils` for conditional classes
- Error handling: `TRPCError` with codes (`NOT_FOUND`, etc.), `notFound()` for missing pages
