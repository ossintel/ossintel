# Agent Instructions: `@app/web`

**Responsibility:** Presentation layer ONLY. Business logic belongs in reusable packages.
**App:** `@app/web` (private, Next.js 15 dashboard).

## Tech Stack
Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, Fumadocs, React Query, IndexedDB (idb).

## Routes
- `(home)/`: Landing & search
- `user/[username]/`: Developer dashboard
- `repo/[owner]/[name]/`: Repo intelligence
- `docs/[[...slug]]/`: Documentation
- `api/`: API routes
- `og/`: OpenGraph images

## Architecture & Conventions
- **Component Structure:** `src/components/ai/`, `src/components/dashboard/`, `src/components/ui/` (shadcn primitives).
- **Hooks (`src/hooks/`):** Strict query isolation. NEVER use raw `useQuery` inside components. Custom hooks for all data fetching.
- **Conventions:** Dash-case filenames, arrow function components.
- **Fumadocs:** Do NOT break the fumadocs-mdx documentation pipeline.

## Tooling
- **Dev Server:** `pnpm.cmd dev` (port 3001)
- **Typecheck:** `pnpm.cmd types:check`
