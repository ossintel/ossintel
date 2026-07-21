# OSSIntel Web

The primary user interface for OSSIntel.

## Responsibilities

- Search
- Dashboards
- Visualizations
- AI summaries
- Reports
- External integrations

## Features

### Developer Intelligence

Analyze GitHub users and their OSS footprint:

- OSS Impact Score, Maintainer Score, Ecosystem Contribution Score
- Expertise areas, contribution consistency, organizations
- Top repositories, top npm packages, total downloads
- External contributions classified by type (code, docs, tests, chores) and weighted by target repo popularity
- AI-generated narrative — explains the numbers, never invents them

### Repository Intelligence

Analyze repositories for health and risk:

- Health Score, Risk Score, Community Score, Activity Score
- Bus factor estimate, contributor diversity
- Release quality and cadence, maintenance trend
- Actionable findings and recommendations

### Package Intelligence

Analyze npm packages (planned):

- Download trends, maintainer activity
- Dependency health, bundle size
- Security posture via OpenSSF Scorecard

## Integrations

OSSIntel complements existing tools rather than replacing them:

- **GitHub** — source of truth for repo and user data
- **npm** — download stats and package metadata
- **CodeWiki / DeepWiki** — architecture exploration
- **ChatGPT** — pre-built prompt links for deeper analysis

## Non-goals

Business logic belongs in reusable packages (`github-normalizer`, `scoring`, `insights`).

The web app is a thin presentation layer — no scoring, no data fetching logic here.

## Future

- Authentication and saved reports
- Organization dashboards and team analytics
- GitHub App integration
- Historical trend tracking
- Comparative analysis

## Routes

| Route | Purpose |
|-------|---------|
| `(home)/` | Landing + search |
| `user/[username]/` | Developer intelligence |
| `repo/[owner]/[name]/` | Repository intelligence |
| `docs/[[...slug]]/` | Documentation |
| `api/` | API endpoints |

## Tech Stack

- Next.js 15
- Tailwind CSS v4
- shadcn/ui
- React Query
- Fumadocs
- IndexedDB (idb)

## Development

```bash
# Start the development server (runs on port 3001)
pnpm.cmd dev

# Typecheck the web application
pnpm.cmd types:check
```
