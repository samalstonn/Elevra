import { headers } from "next/headers";
import type { Metadata } from "next";
import LayoutClient from "./(layout)/LayoutClient";

const BASE_KEYWORDS = [
  "local elections",
  "election results",
  "elections near me",
  "local government",
  "voter information",
  "candidate profiles",
  "election resources",
  "community engagement",
  "political campaigns",
  "municipal elections",
  "county election calendar",
  "city council races",
  "mayoral campaigns",
  "school board elections",
  "candidate portals",
  "campaign promotion",
  "voter guides",
  "election results",
  "elevra community",
  "civic engagement platform",
  "community elections",
];

const baseMetadata: Metadata = {
  title: {
    default: "Elevra",
    template: "%s | Elevra",
  },
  description:
    "Elevra Community spotlights upcoming local elections, connects voters with nearby races, and gives candidates a modern portal to share their message.",
  icons: {
    icon: "/favicon.ico",
  },
  keywords: BASE_KEYWORDS,
  openGraph: {
    title: "Elevra Community | Discover Local Elections & Candidate Portals",
    description:
      "Explore municipal races, candidate profiles, and local election resources with Elevra Community. See elections near you and help campaigns reach their voters.",
    url: "https://www.elevracommunity.com",
    siteName: "Elevra Community",
    images: [
      {
        url: "/Elevra.png",
        width: 1200,
        height: 630,
        alt: "Elevra Community Local Election Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: { //EDIT: do we have a twitter?
    card: "summary_large_image",
    title: "Elevra Community | Local Elections Near You",
    description:
      "Stay on top of local elections, review candidate portals, and connect with your community using Elevra Community.",
    images: ["/Elevra.png"],
    site: "@ElevraCommunity",
    creator: "@ElevraCommunity",
  },
  metadataBase: new URL("https://www.elevracommunity.com"),
};

const normalizeKeyword = (value: string) =>
  value
    .replace(/[()]/g, "")
    .replace(/%20/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .trim();

const extractPathKeywords = (path: string) => {
  const decodedPath = decodeURIComponent(path.split("?")[0] ?? "");
  return decodedPath
    .split("/")
    .filter(Boolean)
    .flatMap((segment) => normalizeKeyword(segment).split(" "))
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 2 && !keyword.includes("layout"));
};

export async function generateMetadata(): Promise<Metadata> {
  const keywordSet = new Set(BASE_KEYWORDS);
  const headerList = await headers();
  const pathCandidate =
    headerList.get("x-invoke-path") ??
    headerList.get("x-matched-path") ??
    headerList.get("next-url") ??
    "";

  extractPathKeywords(pathCandidate).forEach((keyword) =>
    keywordSet.add(keyword)
  );

  return {
    ...baseMetadata,
    keywords: Array.from(keywordSet),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
