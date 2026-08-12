# AGENTS.md

## Runtime

- Node.js 20.9 or newer; current LTS preferred
- pnpm 10; use the pinned package manager from `package.json`
- Do not start a development server when one is already running
- Playwright targets an existing server through `PLAYWRIGHT_BASE_URL`; its config has no `webServer`
- Arch Linux browser dependency warnings may be ignored when the installed browsers run

## Commands

- `pnpm dev` - Turbopack development server
- `pnpm build` - production build
- `pnpm lint` - ESLint
- `pnpm typecheck` - TypeScript
- `pnpm test` - Vitest
- `pnpm test:e2e` - Playwright against the existing server
- `pnpm format:write` / `pnpm format:check` - Prettier
- `pnpm db:generate` - generate a new migration
- `pnpm db:migrate` - ensure the schema exists and apply migrations
- `pnpm db:push` - direct development schema push

## Architecture

- Next.js App Router; Server Components are the default
- Client Components require `'use client';`
- Server tRPC: `@/trpc/server`; client tRPC hooks: `@/trpc/react`
- Import `AppRouter` with strict `import type` in client code to keep Node.js database modules out of
  browser bundles
- tRPC input uses Zod; authenticated endpoints use `protectedProcedure`; expected failures use
  `TRPCError`
- Forms use react-hook-form, Zod, and `@hookform/resolvers/zod`
- Styling uses Tailwind and `cn()` from `@/lib/utils`
- UI primitives follow the local shadcn new-york style and Radix behavior
- Icons come from `lucide-react`; do not use text glyphs, emoji, handmade SVG, or CSS drawings

## Product language and UX

- Use Library, To Read, and Finished consistently
- Add and edit books through `src/components/book-form.tsx`; keep their layouts aligned
- Contextual sayings live in `src/lib/product-sayings.ts` and must use the relevant category
- Write only copy that helps users understand the product or complete their task
- Never expose implementation details, component reuse, validation consistency, frameworks, or
  internal architecture in user-facing copy
- Do not add explanatory filler to occupy space
- Keep app controls and badges near the established small radius; avoid pill styling
- Book cards may change border or text color on hover but must not scale, lift, or add a larger shadow
- The Library uses 12 books per page at every viewport width
- Font sizing scales above 1080px through `src/styles/globals.css`

## Release notes

- `src/lib/releases.ts` is the source of truth. Keep entries in newest-first semantic-version order.
- Add one release-manifest entry per released feature branch. Bump one minor version for each feature
  branch and keep `package.json` equal to the newest manifest version.
- Give every meaningful user-visible feature its own short title and plain-language description.
- Clearly identify brand-new capabilities as new. Do not phrase a new feature as an improvement to
  something that did not previously exist.
- Explain what changed, why it is useful, and how the reader can use it. For settings or other
  non-obvious features, name the exact page, tab, or action where the feature can be found.
- Mention important limits or exclusions when omitting them could create a false expectation. Keep
  implementation details, frameworks, schema changes, and internal procedure names out of the copy.
- Describe only behavior present in the release. Do not advertise deferred work or overstate what
  imported, exported, restored, synchronized, or otherwise transferred data includes.
- Keep notes easy to scan. Prefer one to three concise sentences per feature over vague one-line
  summaries or exhaustive change logs.
- Update release-manifest tests whenever its structure or ordering changes. Keep the package-version
  consistency check passing.

## Code style

- External imports first, then `@/` imports; use `import type` for type-only imports
- 2-space indent, single quotes, semicolons, 100-character width, ES5 trailing commas
- Files use kebab-case; components and types use PascalCase; values and functions use camelCase
- Strict TypeScript and `noUncheckedIndexedAccess`; check indexed access
- Preserve existing behavior and nearby patterns; avoid unrelated refactors

## Database compatibility

- `src/server/drizzle/0000` through `0009` and matching snapshots are immutable historical records
- Never edit, overwrite, rename, reorder, or delete historical migrations or snapshots
- All schema changes are append-only. Generate and review a new migration.
- Never run `db:migrate` or `db:push` unless the user asks
- Keep `scripts/ensure-db-schema.ts`; database commands depend on this compatibility check
- Preserve Laravel `$2y$` bcrypt support in `src/server/auth/password.ts` and its regression test
- Store only hashes of password reset and email verification tokens; raw tokens belong only in links
- Schema changes must preserve the `quillify` PostgreSQL namespace and cascade relationships

## Verification

- Run the narrowest test first
- Before completion run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
  `pnpm build`
- Run `pnpm test:e2e` only when the existing app server is available
- Verify historical migration hashes or a zero diff for `0000` through `0009`
- Do not claim browser verification when Playwright could not connect
