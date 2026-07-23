---
"@ossintel/input-parser": minor
"@ossintel/github-normalizer": patch
"@ossintel/npm": patch
"@app/web": patch
---

Introduce the `@ossintel/input-parser` package to isolate search query resolution across platforms. Refine the landing page search query parsing, add a syntax guide, support `/org/[orgname]` routing alongside `/user/[username]`, implement client-side URL healing redirects, move package details pages to root-level `/package/[registry]/[...packageName]`, fix the npm downloads API 405 error for scoped packages, add fetchPinnedRepositories GraphQL query support to @ossintel/github-normalizer, redesign the organization portfolio into a multi-signal 8-stage visual Ecosystem Lifecycle Map, integrate GitHub App installation access token support, add client-side dynamic viewer installation banners on profile pages, and include a rate-limit installation warning CTA.
