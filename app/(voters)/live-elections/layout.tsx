import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Elections",
  description:
    "Track active local elections, explore candidates, and stay informed about races happening right now.",
  openGraph: {
    title: "Live Elections | Elevra",
    description:
      "See which local elections are currently active and review candidates participating in each race.",
  },
  twitter: {
    card: "summary",
    title: "Live Elections | Elevra",
    description:
      "See which local elections are currently active and review candidates participating in each race.",
  },
};

export default function LiveElectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
