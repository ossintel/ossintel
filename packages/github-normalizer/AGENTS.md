# Agent Instructions: `@ossintel/github-normalizer`

**Responsibility:** Fetch and normalize GitHub REST/GraphQL data into typed domain models.
**Note:** Package may be renamed to `@ossintel/github`.

## Key Files
- `src/client.ts`: API client.
- `src/github-normalizer.ts`: Core normalization logic (approx 14KB).
- `src/types.ts`: Domain types (approx 6KB).

## Exports
- **Raw Types:** `RawGitHub*`
- **Normalized Types:** `NormalizedDeveloper`, `NormalizedRepository`, etc.
- **Errors:** `GitHubHttpError`, `GitHubRateLimitError`
- **Other:** `InputDetectionResult`, `LinkedIdentitySuggestions`

## Rules & Constraints
- **Output Contract:** Always return normalized domain models. NEVER expose raw GitHub responses.
- **Handling:** Must handle pagination, rate limits, and error wrapping.
- **Must NOT:** Calculate scores, generate insights, contain UI logic, or invoke AI.
- **Pattern:** This package pattern will be replicated for `@ossintel/npm`, `@ossintel/stackoverflow`, etc.

## Tooling
- **Test:** `pnpm.cmd test --filter=@ossintel/github-normalizer`
