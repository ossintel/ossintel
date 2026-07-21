# Contributing to OSSIntel

## Project Structure

OSSIntel is a monorepo powered by pnpm workspaces and Turborepo.

- **Packages:** `@ossintel/github-normalizer`, `@ossintel/scoring`, `@ossintel/insights`
- **Apps:** `@app/web` (Next.js 15)
- **Tooling:**
  - `tooling/tsconfig/` (shared TypeScript configs)
  - `tooling/scripts/` (build and release scripts)
  - `tooling/generators/` (Plop code generators)

We enforce strict TypeScript, use Biome for linting and formatting, Vitest for testing, and Changesets for releases.
The package manager used across the monorepo is `pnpm.cmd`.

## Commands

Always use `pnpm.cmd` (do not use npm, yarn, or bare pnpm).

- **Install dependencies:** `pnpm.cmd install`
- **Build all packages and apps:** `pnpm.cmd build`
- **Start development servers:** `pnpm.cmd dev`
- **Run tests:** `pnpm.cmd test`
- **Lint and format:** `pnpm.cmd lint:fix`
- **Typecheck:** `pnpm.cmd typecheck` (from root) or `pnpm.cmd types:check` (inside `apps/web`)
- **Generate component:** `pnpm.cmd gen`
- **Format code:** `pnpm.cmd format`
- **Release:** `pnpm.cmd release`

## Workflow

### Branches
Use conventional branch names: `feat/`, `fix/`, `docs/`, `chore/`.

### Commits
We follow [Conventional Commits](https://www.conventionalcommits.org/), which is enforced by commitlint.

### Pull Requests
A changeset is required for any package changes. Run `pnpm.cmd changeset` before opening your PR.

<hr />

<p align="center" style="text-align:center">with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
