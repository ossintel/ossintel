import type { NormalizedContribution } from "@ossintel/github-normalizer";
import type { NormalizedNpmUser } from "@ossintel/npm";
import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";
import { matchTopic, TOPIC_MAPPINGS } from "./topic-mappings";
import type { IdentityScoringInputs, TopicExpertise } from "./types";

interface SkillsInputs {
  repositories: IdentityScoringInputs["repositories"];
  externalContributions: NormalizedContribution[];
  npmUser?: NormalizedNpmUser | null;
  stackoverflowUser?: NormalizedStackOverflowUser | null;
}

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
    const matchedCats = new Set<string>();
    for (const [cat, keywords] of Object.entries(TOPIC_MAPPINGS)) {
      for (const kw of keywords) {
        if (new RegExp(`\\b${kw}\\b`, "i").test(searchStr)) {
          matchedCats.add(cat);
        }
      }
    }
    for (const cat of matchedCats) {
      skillsMap[cat].githubPrs += 1;
    }
  }

  // Aggregate npm package metrics
  if (npmUser?.packages) {
    for (const pkg of npmUser.packages) {
      const searchStr = `${pkg.name} ${pkg.description || ""} ${pkg.categories.join(" ")}`;
      const matchedCats = new Set<string>();
      for (const [cat, keywords] of Object.entries(TOPIC_MAPPINGS)) {
        for (const kw of keywords) {
          if (new RegExp(`\\b${kw}\\b`, "i").test(searchStr)) {
            matchedCats.add(cat);
          }
        }
      }
      for (const cat of matchedCats) {
        skillsMap[cat].npmPackages += 1;
        skillsMap[cat].npmDownloads += pkg.downloads;
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
    const githubStarsWeight = Math.min(40, Math.log10(ev.githubStars + 1) * 10);
    const githubPrsWeight = Math.min(25, ev.githubPrs * 2.5);
    const npmPackagesWeight = Math.min(20, ev.npmPackages * 5);
    const npmDownloadsWeight = Math.min(
      30,
      Math.log10(ev.npmDownloads + 1) * 5,
    );
    const soScoreWeight = Math.min(
      35,
      Math.log10(ev.stackoverflowScore + 1) * 10,
    );
    const soAnswersWeight = Math.min(25, ev.stackoverflowAnswers * 0.5);

    const rawScore =
      githubStarsWeight +
      githubPrsWeight +
      npmPackagesWeight +
      npmDownloadsWeight +
      soScoreWeight +
      soAnswersWeight;
    const score = Math.round(Math.min(100, rawScore));

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
