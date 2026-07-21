# Agent Instructions: `@ossintel/scoring`

**Responsibility:** Deterministic scoring engine using pure functions with no side effects.

## Key Files
- `src/scoring.ts`: All algorithms (approx 18KB).
- `src/types.ts`: Score types (approx 1.5KB).

## I/O
- **Inputs:** `ScoringInputs` (NormalizedRepository + optional contributors/releases/languages), `IdentityScoringInputs` (repositories + optional npm/contributions/orgs).
- **Outputs:** `RepositoryScores` (overall, health, impact, activity, community, risk), `IdentityScores` (overall, maintainer, contributor, organization, influence, confidence, evidence, factors, badges).
- **Dependencies:** `@ossintel/github-normalizer` (for input types).

## Rules & Constraints
- **INVARIANT:** The same inputs MUST ALWAYS produce the exact same outputs.
- **Must NOT:** Call external APIs, invoke AI, or render UI.
- **Ecosystem Impact Engine:** Classifies PRs (code/docs/test/chore) and weights them by target repo stars (Tier 1: ≥20k, Tier 2: ≥2k, Tier 3: <2k).

## Tooling
- **Test:** `pnpm.cmd test --filter=@ossintel/scoring`
