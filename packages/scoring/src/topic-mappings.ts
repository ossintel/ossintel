/** Canonical topic-to-keyword mappings for skill classification. */
export const TOPIC_MAPPINGS: Record<string, string[]> = {
  React: ["react", "reactjs", "jsx", "react-dom", "remix", "nextjs", "next.js"],
  TypeScript: ["typescript", "ts"],
  "Node.js": [
    "nodejs",
    "node",
    "express",
    "koa",
    "npm",
    "yarn",
    "pnpm",
    "nest",
    "nestjs",
  ],
  JavaScript: ["javascript", "js", "ecmascript"],
  Python: ["python", "py", "django", "flask", "fastapi", "numpy", "pandas"],
  Rust: ["rust", "cargo", "wasm-bindgen"],
  "Next.js": ["nextjs", "next.js"],
  Vue: ["vue", "vuejs", "nuxt", "nuxtjs"],
  Docker: ["docker", "kubernetes", "k8s", "devops", "aws", "gcp"],
  Database: [
    "sql",
    "postgres",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "sqlite",
    "prisma",
  ],
  CSS: ["css", "sass", "scss", "tailwind", "tailwindcss", "postcss"],
};

/** Match a raw topic/language string to a canonical category name. */
export const matchTopic = (nameOrTopic: string): string | null => {
  const normalized = nameOrTopic.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [category, keywords] of Object.entries(TOPIC_MAPPINGS)) {
    if (category.toLowerCase() === normalized) return category;
    for (const kw of keywords) {
      if (kw.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) {
        return category;
      }
    }
  }
  return null;
};
