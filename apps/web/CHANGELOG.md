# @app/web

## 0.0.1

### Patch Changes

- [`a4f49ed`](https://github.com/ossintel/ossintel/commit/a4f49ed150ffd4717048f15578fc5e2018d36f9f) Thanks [@mayank1513](https://github.com/mayank1513)! - Introduce the `@ossintel/input-parser` package to isolate search query resolution across platforms. Refine the landing page search query parsing, add a syntax guide, support `/org/[orgname]` routing alongside `/user/[username]`, implement client-side URL healing redirects, move package details pages to root-level `/package/[registry]/[...packageName]`, fix the npm downloads API 405 error for scoped packages, add fetchPinnedRepositories GraphQL query support to @ossintel/github-normalizer, and redesign the organization portfolio into a multi-signal 8-stage visual Ecosystem Lifecycle Map.

- [`35424bf`](https://github.com/ossintel/ossintel/commit/35424bfe88a5ea787a7256778bce65c129faaf2f) Thanks [@mayank1513](https://github.com/mayank1513)! - Refine backend data caching to correctly utilize credentials during cache population, resolve TypeScript type compilation errors on the user profile page, and redirect OAuth callback errors to the home page with graceful client-side alert handling.

- [`aa09b5a`](https://github.com/ossintel/ossintel/commit/aa09b5aff5fc972e614419bd0de295f7ad7b7587) Thanks [@mayank1513](https://github.com/mayank1513)! - Implement resilient backend caching using next.js unstable_cache with auto-update thresholds, and client-side IndexedDB LRU cache with configurable storage quotas and stale time settings.

- Updated dependencies [[`900e223`](https://github.com/ossintel/ossintel/commit/900e2232109d5be0f7aceaf19b6b23879c7c6810), [`a4f49ed`](https://github.com/ossintel/ossintel/commit/a4f49ed150ffd4717048f15578fc5e2018d36f9f)]:
  - @ossintel/github-normalizer@0.1.1
  - @ossintel/input-parser@0.1.0
  - @ossintel/npm@0.0.2
  - @ossintel/insights@0.1.1
  - @ossintel/scoring@0.1.1
