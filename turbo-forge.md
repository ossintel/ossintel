# Turboforge Conventions

Turboforge keeps this monorepo aligned: consistent package shape, shared tooling, docs pipeline, and upgrade path from upstream templates.

## Generators

Scaffold new packages or components with Plop — do not hand-roll new packages.

```bash
pnpm.cmd gen          # list available generators
pnpm.cmd gen pkg       # scaffold a new package
```

## File Naming

All source files use **dash-case**: `profile-card.tsx`, `use-intel.ts`, `api-helpers.ts`.  
Folders are lowercased and domain-scoped.

## Docs Automation

API docs are generated via Typedoc and rendered as MDX through Fumadocs.

**Do not break:**

- `fumadocs-mdx` compilation (`fumadocs-mdx && next build`)
- Typedoc output format (used by `@turboforge/remark-typedoc-mdx`)
- MDX rendering in `docs/[[...slug]]/`

JSDoc all exported functions — Typedoc picks these up automatically.

## Lint & Format

Global Biome config at root `biome.json`. Shared rules apply to all packages.

```bash
pnpm.cmd lint:fix     # fix all violations + format
```

No per-package Biome config unless overriding a specific rule — keep it DRY.

## Testing

Vitest with shared config at root `vitest.config.mts`. Coverage via `@vitest/coverage-v8`.

```bash
pnpm.cmd test         # run all tests with coverage
```

Test files live next to source: `scoring.ts` → `scoring.test.ts`.
For filtering tests, use `pnpm.cmd test -- <pattern>`.

## TypeScript

Shared configs in `tooling/tsconfig/`. Extend the right base:

- `@tool/tsconfig/library` — for packages
- `@tool/tsconfig/nextjs` — for `apps/web`

Do not duplicate TS options already defined in the shared config.

## Release

A changeset is required for every package change before merging.

Always add changesets for any package change, even if it is a minor fix. Changesets are used to generate the changelog and version bumps.
