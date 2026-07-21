// Repository scoring

// Supporting modules
export { calculateBadges } from "./badges";
export type { ContributorResult } from "./contributor-scoring";
export { calculateContributorScore } from "./contributor-scoring";
export { generateEvidence, generateFactors } from "./evidence";
// Identity scoring (orchestrator)
export { calculateIdentityScore } from "./identity-scoring";
export type { InfluenceResult } from "./influence-scoring";
export { calculateInfluenceScore } from "./influence-scoring";
export type { KnowledgeScore } from "./knowledge-scoring";
export { calculateKnowledgeScore } from "./knowledge-scoring";
export type { MaintainerResult } from "./maintainer-scoring";
// Identity pillar modules
export { calculateMaintainerScore } from "./maintainer-scoring";
export type { OrganizationResult } from "./organization-scoring";
export { calculateOrganizationScore } from "./organization-scoring";
export type { PublishingScore } from "./publishing-scoring";
// Capability-specific scoring
export { calculatePublishingScore } from "./publishing-scoring";
export {
  calculateActivityScore,
  calculateCommunityScore,
  calculateHealthScore,
  calculateImpactScore,
  calculateRepositoryScore,
  calculateRiskScore,
} from "./repository-scoring";
export { calculateSkills } from "./skills";
export { matchTopic, TOPIC_MAPPINGS } from "./topic-mappings";

// Types
export * from "./types";
