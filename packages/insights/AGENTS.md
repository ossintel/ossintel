# Agent Instructions: `@ossintel/insights`

**Responsibility:** Transform metrics and scores into findings, recommendations, and AI-ready summaries.

## Key Files
- `src/insights.ts`: Generation logic (approx 13.5KB).
- `src/types.ts`: Output types (approx 1KB).

## I/O
- **Outputs:** `Finding` (highlight|warning, categorized), `Recommendation` (prioritized), `PromptContext` (structured text for LLM consumption), `RepositoryInsights`, `IdentityInsights`.
- **Dependencies:** `@ossintel/github-normalizer`, `@ossintel/scoring`.

## Rules & Constraints
- **Three Layers:** 1) Deterministic rules, 2) Template generation, 3) Optional AI summarization.
- **Philosophy:** AI explains data, AI never invents data.
- **Must NOT:** Calculate scores or fetch external data.

## Tooling
- **Test:** `pnpm.cmd test --filter=@ossintel/insights`
