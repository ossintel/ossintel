<!-- AI Project Reference — not for package publishing. Human docs: README.md -->

# OSSIntel Project Context

## Architecture

- **Monorepo**: pnpm workspaces + Turborepo
- **Language**: TypeScript (strict)
- **Web**: Next.js 16 App Router (v16.2.10 actual)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Testing**: Vitest (Globally configured, run `pnpm test` in root)
- **Docs**: Fumadocs + Typedoc
- **Linting**: Biome
- **Release**: Changesets
- **CI**: GitHub Actions
- **Node**: >=22
- **Package Manager**: pnpm@11.13.0

## Data Pipeline Architecture

```mermaid
flowchart LR
    Input[Input\n(username/repo/package)] --> GN[github-normalizer\nfetch + normalize]
    GN --> S[scoring\ndeterministic calc]
    S --> I[insights\nfindings + recs]
    I --> W[web\nrender]
```

## Packages

| Package                      | Alias                         | Description                                                                                                 | Dependencies                                             | Key Exports & Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :--------------------------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/github-normalizer` | `@ossintel/github-normalizer` | Fetches/normalizes GitHub REST/GraphQL data. _May be renamed to `@ossintel/github`_.                        | None (external)                                          | `client.ts`, `github-normalizer.ts`, `types.ts`.<br>**Types**: `NormalizedDeveloper`, `NormalizedRepository`, `NormalizedOrganization`, `NormalizedContributor`, `NormalizedLanguage`, `NormalizedRelease`, `NormalizedContribution`, `InputDetectionResult`, `LinkedIdentitySuggestions`, `RawGitHubUser`, `RawGitHubRepository`, `RawGitHubOrganization`, `RawGitHubContributor`, `RawGitHubRelease`, `RawGitHubSearchIssue`, `GitHubHttpError`, `GitHubRateLimitError`, `GitHubFetchOptions`. |
| `packages/scoring`           | `@ossintel/scoring`           | Deterministic scoring engine. Pure functions. _Invariant: same inputs → same outputs. No API calls, no AI._ | `@ossintel/github-normalizer`                            | `scoring.ts`, `types.ts`.<br>**Types**: `ScoringInputs`, `RepositoryScores`, `IdentityScoringInputs`, `IdentityScores`, `NpmPackageStats`, `PillarEvidence`, `PillarFactors`.                                                                                                                                                                                                                                                                                                                    |
| `packages/insights`          | `@ossintel/insights`          | Transforms metrics into findings, recommendations, AI-ready summaries.                                      | `@ossintel/github-normalizer`, `@ossintel/scoring`       | `insights.ts`, `types.ts`.<br>**Types**: `Finding`, `Recommendation`, `PromptContext`, `RepositoryInsights`, `IdentityInsights`, `IdentityMetadata`.                                                                                                                                                                                                                                                                                                                                             |
| `apps/web`                   | `@app/web`                    | Next.js 15 dashboard, presentation layer only. _Business logic belongs in packages._                        | React Query, IDB, Fumadocs, Lucide React, React Markdown | **Routes**: `(home)/`, `user/[username]`, `repo/[owner]/[name]`, `docs/[[...slug]]`, `api/`, `og/`, `llms.mdx/`, `llms-full.txt/`.<br>**Dirs**: `src/components/ai/`, `src/components/dashboard/`, `src/components/ui/`, `src/hooks/`.                                                                                                                                                                                                                                                           |
| `tooling/`                   | N/A                           | Shared configurations and scripts.                                                                          | N/A                                                      | **Dirs**: `tsconfig/` (base, nextjs, react-library, vite, vite-node), `scripts/` (build/release/rebrand), `generators/` (plop component generators).                                                                                                                                                                                                                                                                                                                                             |

## Type Boundaries

- **Normalizer outputs**: `NormalizedDeveloper`, `NormalizedRepository`, `NormalizedContribution[]`, etc.
- **Scoring inputs**: `ScoringInputs` / `IdentityScoringInputs` (composed from normalizer types).
- **Scoring outputs**: `RepositoryScores` / `IdentityScores`.
- **Insights inputs**: scores + metrics.
- **Insights outputs**: `Finding[]`, `Recommendation[]`, `PromptContext`.

## File Conventions

- Dash-case filenames: `profile-card.tsx`, `use-intel.ts`
- Arrow functions for components, hooks, helpers
- Single responsibility per file
- Named exports only (except where default export is required by framework, e.g., Next.js app router)
- JSDoc on exports
- Tests use `describe`/`it` pattern with Vitest

## Future Direction

- New data source packages following the normalizer pattern: `@ossintel/npm`, `@ossintel/stackoverflow`
- Potential rename: `github-normalizer` → `github` (i.e., `@ossintel/github`)
- Shared types/utils package may be introduced for cross-cutting concerns
- Package Intelligence, Organization Intelligence, CLI, VS Code Extension, GitHub App

## Commands (Token-Efficient for AI)

Limit command output to avoid excessive token usage. **Always use `pnpm.cmd`**.

- **Build**: `pnpm.cmd build 2>&1 | Select-Object -Last 20`
- **Test**: `pnpm.cmd test 2>&1 | Select-Object -Last 30`
- **Lint**: `pnpm.cmd lint:fix 2>&1 | Select-Object -Last 30`
- **Typecheck Web**: Run `pnpm.cmd types:check` inside `apps/web`, pipe to `Select-Object -Last 20`
- **Typecheck Packages**: `pnpm.cmd typecheck 2>&1 | Select-Object -Last 20`
- **Git History**: `git log -n 10 --oneline`
- **Git Changes**: `git diff --stat` (summary) or `git diff -- <file>` (scoped)
- **Search**: Use `rg` (ripgrep) with `-m 5` to cap matches
- **Dev Server**: `pnpm.cmd dev` in root (starts all, port 3001 for web)
