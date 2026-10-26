import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: Boolean(process.env.VERCEL),
  },
  images: {
    unoptimized: true,
  },
  redirects: async () => [
    {
      source: "/namaste-demo",
      destination: "https://youtu.be/JePs5P7x00Q",
      permanent: true,
    },
    {
      source: "/namaste-pitchdeck",
      destination:
        "https://docs.google.com/presentation/d/1ylToostn_PzvF9x4wIJeqpR92oK2ROyb/edit?usp=sharing&ouid=106538074401014575642&rtpof=true&sd=true",
      permanent: true,
    },
  ],
};

export default withMDX(config);
