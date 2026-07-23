import type { NormalizedContribution } from "@ossintel/github-normalizer";
import type { NormalizedNpmUser } from "@ossintel/npm";
import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";
import {
  MAX_SCORE,
  SKILL_DOWNLOADS_CAP,
  SKILL_DOWNLOADS_MULTIPLIER,
  SKILL_PACKAGES_CAP,
  SKILL_PACKAGES_MULTIPLIER,
  SKILL_PRS_CAP,
  SKILL_PRS_MULTIPLIER,
  SKILL_SO_ANSWERS_CAP,
  SKILL_SO_ANSWERS_MULTIPLIER,
  SKILL_SO_SCORE_CAP,
  SKILL_SO_SCORE_MULTIPLIER,
  SKILL_STARS_CAP,
  SKILL_STARS_MULTIPLIER,
} from "./constants";
import { matchTopic, TOPIC_MAPPINGS } from "./topic-mappings";
import type { IdentityScoringInputs, TopicExpertise } from "./types";

interface SkillsInputs {
  repositories: IdentityScoringInputs["repositories"];
  externalContributions: NormalizedContribution[];
  npmUser?: NormalizedNpmUser | null;
  stackoverflowUser?: NormalizedStackOverflowUser | null;
}

// Pre-compile regular expressions to prevent high overhead in nested loops
const compiledRegexCache: Record<string, RegExp[]> = {};
for (const [cat, keywords] of Object.entries(TOPIC_MAPPINGS)) {
  compiledRegexCache[cat] = keywords.map(
    (kw) => new RegExp(`\\b${kw}\\b`, "i"),
  );
}

/** Helper to match topics from search text using the pre-compiled regex cache */
const matchTopicsFromText = (searchStr: string): Set<string> => {
  const matchedCats = new Set<string>();
  for (const [cat, regexes] of Object.entries(compiledRegexCache)) {
    for (const rx of regexes) {
      if (rx.test(searchStr)) {
        matchedCats.add(cat);
      }
    }
  }
  return matchedCats;
};

/**
 * Compute topic expertise scores by aggregating signals across
 * GitHub repos, PRs, npm packages, and Stack Overflow tags.
 */
export const calculateSkills = (inputs: SkillsInputs): TopicExpertise[] => {
  const { repositories, externalContributions, npmUser, stackoverflowUser } =
    inputs;

  const skillsMap: Record<string, TopicExpertise["evidence"]> = {};
  for (const cat of Object.keys(TOPIC_MAPPINGS)) {
    skillsMap[cat] = {
      githubStars: 0,
      githubPrs: 0,
      npmDownloads: 0,
      npmPackages: 0,
      stackoverflowScore: 0,
      stackoverflowAnswers: 0,
    };
  }

  // Aggregate GitHub Repo metrics
  for (const repo of repositories) {
    const topicsToScan = [repo.language, ...(repo.topics || [])].filter(
      Boolean,
    ) as string[];
    const matchedCats = new Set<string>();
    for (const t of topicsToScan) {
      const cat = matchTopic(t);
      if (cat) matchedCats.add(cat);
    }
    for (const cat of matchedCats) {
      skillsMap[cat].githubStars += repo.stargazersCount;
    }
  }

  // Aggregate GitHub PR metrics
  for (const c of externalContributions) {
    const searchStr = `${c.repoFullName} ${c.title} ${c.labels.join(" ")}`;
    const matchedCats = matchTopicsFromText(searchStr);
    for (const cat of matchedCats) {
      skillsMap[cat].githubPrs += 1;
    }
  }

  // Aggregate npm package metrics
  if (npmUser?.packages) {
    for (const pkg of npmUser.packages) {
      const searchStr = `${pkg.name} ${pkg.description || ""} ${pkg.categories.join(" ")}`;
      const matchedCats = matchTopicsFromText(searchStr);
      for (const cat of matchedCats) {
        skillsMap[cat].npmPackages += 1;
        skillsMap[cat].npmDownloads += pkg.weeklyDownloads;
      }
    }
  }

  // Aggregate StackOverflow tag metrics
  if (stackoverflowUser?.topTags) {
    for (const tag of stackoverflowUser.topTags) {
      const cat = matchTopic(tag.name);
      if (cat) {
        skillsMap[cat].stackoverflowScore += tag.score;
        skillsMap[cat].stackoverflowAnswers += tag.count;
      }
    }
  }

  // Calculate final dynamic skill scores
  const skills: TopicExpertise[] = [];
  for (const [topic, ev] of Object.entries(skillsMap)) {
    const githubStarsWeight = Math.min(
      SKILL_STARS_CAP,
      Math.log10(ev.githubStars + 1) * SKILL_STARS_MULTIPLIER,
    );
    const githubPrsWeight = Math.min(
      SKILL_PRS_CAP,
      ev.githubPrs * SKILL_PRS_MULTIPLIER,
    );
    const npmPackagesWeight = Math.min(
      SKILL_PACKAGES_CAP,
      ev.npmPackages * SKILL_PACKAGES_MULTIPLIER,
    );
    const npmDownloadsWeight = Math.min(
      SKILL_DOWNLOADS_CAP,
      Math.log10(ev.npmDownloads + 1) * SKILL_DOWNLOADS_MULTIPLIER,
    );
    const soScoreWeight = Math.min(
      SKILL_SO_SCORE_CAP,
      Math.log10(ev.stackoverflowScore + 1) * SKILL_SO_SCORE_MULTIPLIER,
    );
    const soAnswersWeight = Math.min(
      SKILL_SO_ANSWERS_CAP,
      ev.stackoverflowAnswers * SKILL_SO_ANSWERS_MULTIPLIER,
    );

    const rawScore =
      githubStarsWeight +
      githubPrsWeight +
      npmPackagesWeight +
      npmDownloadsWeight +
      soScoreWeight +
      soAnswersWeight;
    const score = Math.round(Math.min(MAX_SCORE, rawScore));

    if (score > 0) {
      skills.push({
        topic,
        score,
        evidence: ev,
      });
    }
  }
  skills.sort((a, b) => b.score - a.score);

  return skills;
};
