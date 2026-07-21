# OSSIntel

![Banner](./ossintel-banner.jpg)

> Open Source Intelligence Platform

OSSIntel transforms GitHub profiles, repositories, and npm packages into actionable insights.

Unlike GitHub, which primarily shows activity, OSSIntel helps answer questions such as:

- Is this project healthy?
- Can I trust this package?
- How impactful is this maintainer?
- What are the biggest risks?
- Where should contributors start?

## Goals

- Provide deterministic OSS analytics
- Surface meaningful insights using AI
- Help maintainers, contributors, recruiters, and developers make better decisions
- Build a reusable OSS intelligence engine

## Architecture

```
                GitHub APIs
                     │
               npm Registry
                     │
             Future Integrations
                     │
      ┌──────────────────────────┐
      │ github-normalizer        │
      └──────────────────────────┘
                     │
      ┌──────────────────────────┐
      │ scoring                  │
      └──────────────────────────┘
                     │
      ┌──────────────────────────┐
      │ insights                 │
      └──────────────────────────┘
                     │
             Next.js Dashboard
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript (strict) |
| Web | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Testing | Vitest |
| Docs | Fumadocs + Typedoc |
| Linting | Biome |
| Release | Changesets |
| CI | GitHub Actions |

## Packages

### @ossintel/github-normalizer

Fetches and normalizes GitHub data into a stable domain model.

### @ossintel/scoring

Deterministically calculates OSS metrics and scores. Depends on `github-normalizer` for input types.

### @ossintel/insights

Transforms metrics into findings, recommendations, and AI-ready summaries. Depends on `scoring` and `github-normalizer`.

### @app/web

Next.js dashboard — the presentation layer. Business logic lives in the packages above.

Dependency chain: `github-normalizer` → `scoring` → `insights` → `web`

## Principles

- Deterministic first
- AI augments, never replaces
- Typed everywhere
- Small reusable packages
- Testable business logic
- UI remains thin

## Ecosystem Impact Engine

OSSIntel includes a custom Ecosystem Impact Engine that maps developer reach across external projects. It classifies contributions dynamically (code vs. documentation vs. test suites) and weights them by target repository stargazers (importance Tier) to produce an **Ecosystem Contribution Score**.

### Dataflow Pipeline

```text
   [User Input] ──► [github-normalizer] ──► [PR Classification] ──► [scoring Engine]
                           │                                              │
                    (Fetches PRs &                                 (Weights Tiers &
                    Repo Stargazers)                               Quality Factors)
                                                                          │
                                                                          ▼
                                                                  [Ecosystem Score]
                                                                          │
                                                                          ▼
                                                                 [Next.js Dashboard]
```

## AI-assisted Development

This project itself demonstrates AI-assisted software engineering.

The development workflow includes:

1. Brainstorming
2. PRD creation
3. Architecture design
4. Domain modeling
5. Task decomposition
6. AI-assisted implementation
7. Human review and refinement

## Roadmap

- Developer Intelligence
- Repository Intelligence
- Package Intelligence
- Organization Intelligence
- GitHub App
- CLI
- VS Code Extension
