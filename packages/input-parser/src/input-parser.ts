export interface InputDetectionResult {
  /**
   * Target platform: "github" | "npm" | "stackoverflow" | "vscode" | "medium" | "leetcode" | "unknown"
   */
  platform:
    | "github"
    | "npm"
    | "stackoverflow"
    | "vscode"
    | "medium"
    | "leetcode"
    | "unknown";
  /**
   * Target type: "user" | "org" | "repo" | "package" | "unknown"
   */
  type: "user" | "org" | "repo" | "package" | "unknown";
  /**
   * GitHub owner/username or organization login
   */
  owner?: string;
  /**
   * GitHub repository name
   */
  repo?: string;
  /**
   * NPM package or user name
   */
  name?: string;
  /**
   * StackOverflow user profile ID
   */
  profileId?: string;
  /**
   * Raw input search query
   */
  rawInput: string;
}

/**
 * Parses and resolves search query strings into platform and type targets.
 * Supporting URLs, prefixes, and fallback shorthands.
 *
 * @param input - The raw search query entered by the user
 * @returns An object containing the platform, target type, parsed identifiers, and the raw input.
 *
 * @example
 * ```ts
 * detectInput("react18-tools/kosha")
 * // => { platform: "github", type: "repo", owner: "react18-tools", repo: "kosha", rawInput: "react18-tools/kosha" }
 *
 * detectInput("org:react18-tools")
 * // => { platform: "github", type: "org", owner: "react18-tools", rawInput: "org:react18-tools" }
 *
 * detectInput("npm:kosha")
 * // => { platform: "npm", type: "package", name: "kosha", rawInput: "npm:kosha" }
 * ```
 */
export function detectInput(input: string): InputDetectionResult {
  const trimmed = input.trim();

  // 1. Prefix Shortcuts
  if (trimmed.startsWith("npm:pkg:")) {
    return {
      platform: "npm",
      type: "package",
      name: trimmed.slice(8),
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("npm:")) {
    const namePart = trimmed.slice(4);
    if (namePart.startsWith("~")) {
      return {
        platform: "npm",
        type: "user",
        name: namePart.slice(1),
        rawInput: trimmed,
      };
    }
    return {
      platform: "npm",
      type: "package",
      name: namePart,
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("~")) {
    return {
      platform: "npm",
      type: "user",
      name: trimmed.slice(1),
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("so:") || trimmed.startsWith("stackoverflow:")) {
    const prefixLen = trimmed.startsWith("so:") ? 3 : 14;
    return {
      platform: "stackoverflow",
      type: "user",
      profileId: trimmed.slice(prefixLen),
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("org:") || trimmed.startsWith("github:org:")) {
    const prefixLen = trimmed.startsWith("org:") ? 4 : 11;
    return {
      platform: "github",
      type: "org",
      owner: trimmed.slice(prefixLen),
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("user:") || trimmed.startsWith("github:user:")) {
    const prefixLen = trimmed.startsWith("user:") ? 5 : 12;
    return {
      platform: "github",
      type: "user",
      owner: trimmed.slice(prefixLen),
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("github:repo:")) {
    const parts = trimmed.slice(12).split("/");
    return {
      platform: "github",
      type: "repo",
      owner: parts[0] || "",
      repo: parts[1] || "",
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("github:")) {
    const parts = trimmed.slice(7).split("/");
    if (parts.length >= 2) {
      return {
        platform: "github",
        type: "repo",
        owner: parts[0],
        repo: parts[1],
        rawInput: trimmed,
      };
    }
    return {
      platform: "github",
      type: "unknown",
      owner: parts[0],
      rawInput: trimmed,
    };
  }

  // VSCode market place preview placeholders
  if (trimmed.startsWith("vscode:")) {
    const parts = trimmed.slice(7).split("/");
    return {
      platform: "vscode",
      type: parts.length >= 2 ? "package" : "user",
      name: parts.join("."),
      rawInput: trimmed,
    };
  }

  // Medium blogs preview placeholders
  if (trimmed.startsWith("medium:")) {
    return {
      platform: "medium",
      type: "user",
      profileId: trimmed.slice(7),
      rawInput: trimmed,
    };
  }

  // Leetcode preview placeholders
  if (trimmed.startsWith("leetcode:")) {
    return {
      platform: "leetcode",
      type: "user",
      profileId: trimmed.slice(9),
      rawInput: trimmed,
    };
  }

  // 2. Check if it's a URL
  try {
    const url = new URL(
      trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`,
    );
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("github.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "organizations" || parts[0] === "orgs") {
        return {
          platform: "github",
          type: "org",
          owner: parts[1] || "",
          rawInput: trimmed,
        };
      }
      if (parts.length === 1) {
        return {
          platform: "github",
          type: "unknown",
          owner: parts[0],
          rawInput: trimmed,
        };
      }
      if (parts.length >= 2) {
        return {
          platform: "github",
          type: "repo",
          owner: parts[0],
          repo: parts[1],
          rawInput: trimmed,
        };
      }
    }

    if (hostname.includes("npmjs.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "package") {
        return {
          platform: "npm",
          type: "package",
          name: parts.slice(1).join("/"),
          rawInput: trimmed,
        };
      }
      if (parts[0].startsWith("~")) {
        return {
          platform: "npm",
          type: "user",
          name: parts[0].slice(1),
          rawInput: trimmed,
        };
      }
      if (parts[0].startsWith("@")) {
        if (parts.length === 1) {
          return {
            platform: "npm",
            type: "org",
            name: parts[0],
            rawInput: trimmed,
          };
        }
        return {
          platform: "npm",
          type: "package",
          name: `${parts[0]}/${parts[1]}`,
          rawInput: trimmed,
        };
      }
    }

    if (hostname.includes("stackoverflow.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "users" && parts[1]) {
        return {
          platform: "stackoverflow",
          type: "user",
          profileId: parts[1],
          name: parts[2] || undefined,
          rawInput: trimmed,
        };
      }
    }

    if (hostname.includes("medium.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const userPart = parts[0]?.startsWith("@") ? parts[0].slice(1) : parts[0];
      if (userPart) {
        return {
          platform: "medium",
          type: "user",
          profileId: userPart,
          rawInput: trimmed,
        };
      }
    }
  } catch {
    // Treat as non-URL text
  }

  // 3. Fallback Non-URLs
  if (trimmed.startsWith("organizations/") || trimmed.startsWith("orgs/")) {
    const parts = trimmed.split("/");
    return {
      platform: "github",
      type: "org",
      owner: parts[1] || "",
      rawInput: trimmed,
    };
  }

  if (trimmed.startsWith("@") && trimmed.includes("/")) {
    return {
      platform: "npm",
      type: "package",
      name: trimmed,
      rawInput: trimmed,
    };
  }

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    return {
      platform: "github",
      type: "repo",
      owner: parts[0],
      repo: parts[1],
      rawInput: trimmed,
    };
  }

  // Single word default
  return {
    platform: "github",
    type: "unknown",
    owner: trimmed,
    rawInput: trimmed,
  };
}
