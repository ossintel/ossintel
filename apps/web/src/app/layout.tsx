import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "./global.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://ossintel.js.org";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: "%s | OSSIntel",
    default: "OSSIntel - Open Source Intelligence Audit Platform",
  },
  description:
    "Evaluate, audit, and analyze open-source developers, portfolios, and repositories using deterministic metrics and security insights.",
  keywords: [
    "ossintel",
    "open-source intelligence",
    "developer audit",
    "repository scores",
    "health metrics",
    "security evaluation",
    "npm dependency assessment",
  ],
  openGraph: {
    type: "website",
    siteName: "OSSIntel",
    locale: "en_US",
    title: "OSSIntel - Open Source Intelligence Audit Platform",
    description: "Evaluate developer portfolios and codebase health robustly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OSSIntel - Open Source Intelligence Audit Platform",
    description: "Evaluate developer portfolios and codebase health robustly.",
  },
};

import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen dark">
        <Providers>
          <RootProvider>
            <Header />
            {children}
          </RootProvider>
        </Providers>
      </body>
    </html>
  );
}
