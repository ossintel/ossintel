# Domain Model

The domain model represents the shared language across all OSSIntel packages.

## Developer

Represents an open source contributor or maintainer.

## Repository

Represents a source code repository.

## Organization

Represents an organization that owns repositories and packages.

## Package

Represents a published software package (npm initially; later NuGet, PyPI, crates.io, Go, etc.).

## Contribution

Represents commits, pull requests, issues, reviews, and other upstream contributions.

## Release

Represents a published software release.

## Metric

A measurable value derived from normalized provider data.

Examples:

- Stars
- Downloads
- Contributors
- Releases
- Issue response time

## Score

A deterministic evaluation computed from metrics.

Examples:

- Health
- Impact
- Activity
- Community
- Risk

## Finding

A significant observation derived from metrics.

## Recommendation

A suggested action derived from findings.

## Insight

A human-readable explanation combining findings, recommendations, and optional AI summarization.

## OSS Identity

A unified open source identity that aggregates multiple providers into a single developer profile.

GitHub is the **primary identity**. Additional providers (npm, Stack Overflow, and future ecosystems) enrich the identity without replacing it.

### Identity Principles

- GitHub defines the **core OSS reputation**.
- Additional providers contribute **capability-specific evidence**.
- Linking additional providers can **only increase** reputation, confidence, achievements, and evidence—it must never reduce any score.
- Providers are grouped by **capability**, not platform.

### Capability Buckets

- **Core OSS** (GitHub)
- **Package Publishing** (npm, NuGet, PyPI, crates.io, Go, etc.)
- **Knowledge Sharing** (Stack Overflow, Dev.to, Hashnode, etc.)
- Additional capability buckets may be introduced without changing the scoring model.

## Identity Aggregation Rules

- Lifetime impact aggregates historical reach across repositories and packages, including archived assets.
- Active maintenance is calculated using active (non-archived) repositories only.
- Archived repositories contribute to lifetime impact but not ongoing maintenance metrics.
- Capability buckets are additive. If a developer has no data for a capability (for example, no published packages), that bucket contributes **0** rather than reducing existing scores.

## Guiding Principle

Every package should operate on these domain concepts rather than provider-specific API responses. The scoring model should be **transparent, deterministic, extensible, and monotonic**—adding verified data must never decrease a developer's OSS identity score.
