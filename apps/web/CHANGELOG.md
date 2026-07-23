# @app/web

## 0.0.3

### Patch Changes

- [`9e9da7e`](https://github.com/ossintel/ossintel/commit/9e9da7e1470c159ac92cc4bc76d8e273bddda9ee) Thanks [@mayank1513](https://github.com/mayank1513)! - Refactor query hooks, IndexedDB cache store, server stale-while-revalidate Cache-Aside wrapper, token resolution, API error response handling, and the dashboard repositories table sorting/filtering UI elements to deduplicate setup logic.

- Updated dependencies [[`84c0617`](https://github.com/ossintel/ossintel/commit/84c061727de8b535e9c58110119bd5992860c805), [`1f59c90`](https://github.com/ossintel/ossintel/commit/1f59c90a9c30577a9ce1b7839582cd7c891b2e53), [`d77c312`](https://github.com/ossintel/ossintel/commit/d77c312bed95f378b5c82a9015d8fbb903c61cda), [`292dde5`](https://github.com/ossintel/ossintel/commit/292dde58de31dd33e51b9bc443037cf3ad8af776), [`32b58f8`](https://github.com/ossintel/ossintel/commit/32b58f857a6c89b0665b89f1a5480eb32652d972), [`9a0f854`](https://github.com/ossintel/ossintel/commit/9a0f85481dae141a87a5ba1dcebb8fd70491feb9)]:
  - @ossintel/github-normalizer@0.1.3
  - @ossintel/input-parser@0.2.1
  - @ossintel/insights@0.1.3
  - @ossintel/npm@0.0.4
  - @ossintel/scoring@0.1.3
  - @ossintel/stackoverflow@0.0.2

## 0.0.2

### Patch Changes

- [`bf91f5d`](https://github.com/ossintel/ossintel/commit/bf91f5d05b9edc69213a8643e7586888331b0c8d) Thanks [@mayank1513](https://github.com/mayank1513)! - Introduce the `@ossintel/input-parser` package to isolate search query resolution across platforms. Refine the landing page search query parsing, add a syntax guide, support `/org/[orgname]` routing alongside `/user/[username]`, implement client-side URL healing redirects, move package details pages to root-level `/package/[registry]/[...packageName]`, fix the npm downloads API 405 error for scoped packages, add fetchPinnedRepositories GraphQL query support to @ossintel/github-normalizer, redesign the organization portfolio into a multi-signal 8-stage visual Ecosystem Lifecycle Map, integrate GitHub App installation access token support, add client-side dynamic viewer installation banners on profile pages, and include a rate-limit installation warning CTA.

- Updated dependencies [[`bf91f5d`](https://github.com/ossintel/ossintel/commit/bf91f5d05b9edc69213a8643e7586888331b0c8d)]:
  - @ossintel/input-parser@0.2.0
  - @ossintel/github-normalizer@0.1.2
  - @ossintel/npm@0.0.3
  - @ossintel/insights@0.1.2
  - @ossintel/scoring@0.1.2

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
