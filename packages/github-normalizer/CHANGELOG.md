# @ossintel/github-normalizer

## 0.1.1

### Patch Changes

- [`900e223`](https://github.com/ossintel/ossintel/commit/900e2232109d5be0f7aceaf19b6b23879c7c6810) Thanks [@mayank1513](https://github.com/mayank1513)! - Parallelize paginated search requests and repository metadata fetches to speed up external contributions loading.

- [`a4f49ed`](https://github.com/ossintel/ossintel/commit/a4f49ed150ffd4717048f15578fc5e2018d36f9f) Thanks [@mayank1513](https://github.com/mayank1513)! - Introduce the `@ossintel/input-parser` package to isolate search query resolution across platforms. Refine the landing page search query parsing, add a syntax guide, support `/org/[orgname]` routing alongside `/user/[username]`, implement client-side URL healing redirects, move package details pages to root-level `/package/[registry]/[...packageName]`, fix the npm downloads API 405 error for scoped packages, add fetchPinnedRepositories GraphQL query support to @ossintel/github-normalizer, and redesign the organization portfolio into a multi-signal 8-stage visual Ecosystem Lifecycle Map.

## 0.1.0

### Minor Changes

- [`632511d`](https://github.com/ossintel/ossintel/commit/632511d67393c627bfd0854d37fcff7d74ab1f2b) Thanks [@mayank1513](https://github.com/mayank1513)! - Implement the explainable four-pillar OSSIQ reputation engine, support quality-weighted scoring for external contributions, sustained maintenance bonuses, active organization leadership evaluation, and dynamic developer portfolio metrics.

### Patch Changes

- [`837e771`](https://github.com/ossintel/ossintel/commit/837e7717a6408be37ced6db704cc688f40c522f7) Thanks [@mayank1513](https://github.com/mayank1513)! - Add support for querying user social accounts from the GitHub API and exposing them as `socialLinks` on the normalized developer profiles. This allows suggestions engine to detect Stack Overflow identities linked in user's GitHub social accounts.

- [`8ce6c92`](https://github.com/ossintel/ossintel/commit/8ce6c92bac6b49a37a0ebcec39aa131f3a432001) Thanks [@mayank1513](https://github.com/mayank1513)! - Add pagination to fetchExternalContributions up to 10 pages to resolve older contributions.
