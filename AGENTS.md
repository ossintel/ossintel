@CONTEXT.md
@CODING_STANDARDS.md

# OSSIntel Development Guidelines

## Documentation First
Read project documentation before implementing anything. Priority:
1. Relevant package `README.md`
2. Root `README.md`
3. `turbo-forge.md`
4. Relevant docs under `docs/`, `packages/**/docs/*`
5. Relevant files under `.agents/skills/`

## README Rules
- Do **not** modify auto-generated badges or installation sections (HTML used for docs pipeline).
- Update remaining sections only when required.

## Turbo Forge
Follow conventions in `turbo-forge.md`. Do not introduce new structure/tooling unless requested.

## Documentation Automation
Do not break documentation generation, Typedoc output, or Fumadocs rendering.

## DRY
Search for existing implementations. Reuse utilities. Prefer extending existing abstractions over creating new ones. Follow `.agents/skills/dry-refactoring`. Avoid duplicate logic, utilities, and types.

---
## Package Responsibilities
Keep package boundaries strict.

### github-normalizer
Fetching and normalizing data. Must not calculate scores, generate insights, or contain UI logic.

### scoring
Deterministic calculations. Must not call external APIs, invoke AI, or render UI. The same inputs must always produce the same outputs.

### insights
Interpreting metrics/scores. May generate findings, recommendations, or AI context. Must not calculate scores or fetch external data.

### web
Presentation layer only. Business logic belongs in reusable packages.

---
## Code Quality
Refer to `@CODING_STANDARDS.md`.
- Lint: `pnpm.cmd lint:fix`
- Typecheck web app: `pnpm.cmd types:check` inside `apps/web`
- Typecheck packages: `pnpm.cmd typecheck` in root

## Package Manager
Always use `pnpm.cmd`. Never `npm`, `npx`, `yarn`, or bare `pnpm`.

## Token-Efficient Output
- Pipe output through `| Select-Object -Last N` on PowerShell.
- Use `git log -n 10 --oneline`, `git diff --stat`, `git diff -- <file>`.
- Cap search results: `rg -m 5`, `grep -m 5`.
- Prefer `--filter=<package>` to scope turbo commands.

## Future Architecture
Planned: new data-source packages (`@ossintel/npm`, `@ossintel/stackoverflow`), potential rename of `github-normalizer` to `github`, and a shared types/utils package.

## Goal
Build reusable, deterministic, well-tested libraries that power OSSIntel while preserving existing project architecture.
