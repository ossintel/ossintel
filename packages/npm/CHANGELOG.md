# @ossintel/npm

## 0.0.4

### Patch Changes

- [`292dde5`](https://github.com/ossintel/ossintel/commit/292dde58de31dd33e51b9bc443037cf3ad8af776) Thanks [@mayank1513](https://github.com/mayank1513)! - Refactor npm client and package/user fetchers to use arrow functions, define timing and download constants, and extract CommonNpmFields interface to deduplicate types.

## 0.0.3

### Patch Changes

- [`bf91f5d`](https://github.com/ossintel/ossintel/commit/bf91f5d05b9edc69213a8643e7586888331b0c8d) Thanks [@mayank1513](https://github.com/mayank1513)! - Introduce the `@ossintel/input-parser` package to isolate search query resolution across platforms. Refine the landing page search query parsing, add a syntax guide, support `/org/[orgname]` routing alongside `/user/[username]`, implement client-side URL healing redirects, move package details pages to root-level `/package/[registry]/[...packageName]`, fix the npm downloads API 405 error for scoped packages, add fetchPinnedRepositories GraphQL query support to @ossintel/github-normalizer, redesign the organization portfolio into a multi-signal 8-stage visual Ecosystem Lifecycle Map, integrate GitHub App installation access token support, add client-side dynamic viewer installation banners on profile pages, and include a rate-limit installation warning CTA.

## 0.0.2

### Patch Changes

- [`a4f49ed`](https://github.com/ossintel/ossintel/commit/a4f49ed150ffd4717048f15578fc5e2018d36f9f) Thanks [@mayank1513](https://github.com/mayank1513)! - Introduce the `@ossintel/input-parser` package to isolate search query resolution across platforms. Refine the landing page search query parsing, add a syntax guide, support `/org/[orgname]` routing alongside `/user/[username]`, implement client-side URL healing redirects, move package details pages to root-level `/package/[registry]/[...packageName]`, fix the npm downloads API 405 error for scoped packages, add fetchPinnedRepositories GraphQL query support to @ossintel/github-normalizer, and redesign the organization portfolio into a multi-signal 8-stage visual Ecosystem Lifecycle Map.

## 0.0.1

### Patch Changes

- [`0398adc`](https://github.com/ossintel/ossintel/commit/0398adc99373aaa9c43050f131498224a67f44bb) Thanks [@mayank1513](https://github.com/mayank1513)! - Added support for npm and StackOverflow integrations, including unified identity scoring and new interactive UI components.
