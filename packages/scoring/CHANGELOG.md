# @ossintel/scoring

## 0.1.3

### Patch Changes

- [`32b58f8`](https://github.com/ossintel/ossintel/commit/32b58f857a6c89b0665b89f1a5480eb32652d972) Thanks [@mayank1513](https://github.com/mayank1513)! - Refactor scoring models (repository, contributor, influence, knowledge, maintainer, organization, publishing, identity, badges, skills, and evidence) to replace all magic numbers with constants, and optimize RegExp performance in skills matching.

- Updated dependencies [[`84c0617`](https://github.com/ossintel/ossintel/commit/84c061727de8b535e9c58110119bd5992860c805), [`292dde5`](https://github.com/ossintel/ossintel/commit/292dde58de31dd33e51b9bc443037cf3ad8af776), [`9a0f854`](https://github.com/ossintel/ossintel/commit/9a0f85481dae141a87a5ba1dcebb8fd70491feb9)]:
  - @ossintel/github-normalizer@0.1.3
  - @ossintel/npm@0.0.4
  - @ossintel/stackoverflow@0.0.2

## 0.1.2

### Patch Changes

- Updated dependencies [[`bf91f5d`](https://github.com/ossintel/ossintel/commit/bf91f5d05b9edc69213a8643e7586888331b0c8d)]:
  - @ossintel/github-normalizer@0.1.2
  - @ossintel/npm@0.0.3

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
