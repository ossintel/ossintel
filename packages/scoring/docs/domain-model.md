# Domain Model

The domain model represents the core language shared across all packages.

## Developer

Represents an open source contributor or maintainer.

## Repository

Represents a source code repository.

## Organization

Represents a GitHub organization.

## Package

Represents a published package (npm initially).

## Contribution

Represents commits, pull requests, issues, and reviews.

## Release

Represents a published software release.

## Metric

A measurable value derived from normalized data.

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

A significant observation generated from metrics.

## Recommendation

A suggested action derived from findings.

## Insight

A human-readable explanation combining findings, recommendations, and optional AI summarization.

## OSS Identity

A unified open source identity that aggregates multiple platforms (GitHub, npm, Stack Overflow) and profiles (Users, Organizations, Repositories) into a single representation.

An OSS Identity allows:
- **Platform Aggregation**: Combining a maintainer's primary identity (GitHub) with linked ecosystem profiles (npm, Stack Overflow) to show a complete picture of reach and expertise.
- **Organization Portfolio Selection**: Allowing maintainers to include or exclude specific organization memberships from contributing to their lifetime impact scores.
- **Archived Asset Weighting**: Ensuring that historic, archived repositories contribute to lifetime impact (stars, forks, historical reach) but do not penalize current maintenance indicators (activity, responsiveness, release cadence).

## Identity Aggregation Rules

Identity scores are calculated deterministically across their aggregated components:
- **Lifetime Impact**: Star counts, forks, and npm downloads are aggregated across all associated repositories and packages (including archived ones) to measure historical reach and ecosystem popularity.
- **Active Maintenance & Responsiveness**: Health, Activity, and Community scores are computed as averages over *active (non-archived)* repositories only, preventing abandoned projects from dragging down active maintenance scores.
- **Ecosystem Risk**: Assesses risk averages across active portfolios while treating archived dependencies appropriately.

## Guiding Principle

Every package should operate on these domain concepts rather than platform-specific API responses.
