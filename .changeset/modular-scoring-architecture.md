---
"@ossintel/scoring": minor
---

Refactor monolithic scoring.ts into modular pillar architecture with 12 focused utility modules. Export new capability-specific scoring functions (`calculatePublishingScore`, `calculateKnowledgeScore`) and pillar modules (`calculateMaintainerScore`, `calculateContributorScore`, `calculateOrganizationScore`, `calculateInfluenceScore`). Restore monotonic additive-only identity scoring model where npm/SO bonuses never reduce scores. All existing public API exports remain backward-compatible.
