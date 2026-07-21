import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OSSIntel - Open Source Intelligence Platform",
  description:
    "Unified platform metrics, impact scorecards, active community health, and security risk audits for developers, repositories, and organizations.",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
