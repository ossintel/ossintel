# @ossintel/scoring

## 0.1.1

### Patch Changes

- Updated dependencies [[`900e223`](https://github.com/ossintel/ossintel/commit/900e2232109d5be0f7aceaf19b6b23879c7c6810), [`a4f49ed`](https://github.com/ossintel/ossintel/commit/a4f49ed150ffd4717048f15578fc5e2018d36f9f)]:
  - @ossintel/github-normalizer@0.1.1
  - @ossintel/npm@0.0.2

## 0.1.0

### Minor Changes

- [`b6ced24`](https://github.com/ossintel/ossintel/commit/b6ced24b5fb66e0e0432454b5b96ac55d211105f) Thanks [@mayank1513](https://github.com/mayank1513)! - Refactor monolithic scoring.ts into modular pillar architecture with 12 focused utility modules. Export new capability-specific scoring functions (`calculatePublishingScore`, `calculateKnowledgeScore`) and pillar modules (`calculateMaintainerScore`, `calculateContributorScore`, `calculateOrganizationScore`, `calculateInfluenceScore`). Restore monotonic additive-only identity scoring model where npm/SO bonuses never reduce scores. All existing public API exports remain backward-compatible.

- [`632511d`](https://github.com/ossintel/ossintel/commit/632511d67393c627bfd0854d37fcff7d74ab1f2b) Thanks [@mayank1513](https://github.com/mayank1513)! - Implement the explainable four-pillar OSSIQ reputation engine, support quality-weighted scoring for external contributions, sustained maintenance bonuses, active organization leadership evaluation, and dynamic developer portfolio metrics.

### Patch Changes

- [`0398adc`](https://github.com/ossintel/ossintel/commit/0398adc99373aaa9c43050f131498224a67f44bb) Thanks [@mayank1513](https://github.com/mayank1513)! - Added support for npm and StackOverflow integrations, including unified identity scoring and new interactive UI components.

- [`c5b24bf`](https://github.com/ossintel/ossintel/commit/c5b24bfc361b2bc0f44b09c2fa00ad4140cd3c0c) Thanks [@mayank1513](https://github.com/mayank1513)! - Refactor IdentityScoringInputs organization types to support extra metadata fields and remove any types.

- Updated dependencies [[`0398adc`](https://github.com/ossintel/ossintel/commit/0398adc99373aaa9c43050f131498224a67f44bb), [`837e771`](https://github.com/ossintel/ossintel/commit/837e7717a6408be37ced6db704cc688f40c522f7), [`8ce6c92`](https://github.com/ossintel/ossintel/commit/8ce6c92bac6b49a37a0ebcec39aa131f3a432001), [`632511d`](https://github.com/ossintel/ossintel/commit/632511d67393c627bfd0854d37fcff7d74ab1f2b)]:
  - @ossintel/npm@0.0.1
  - @ossintel/stackoverflow@0.0.1
  - @ossintel/github-normalizer@0.1.0
