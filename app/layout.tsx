import LayoutClient from "./(layout)/LayoutClient";

export const metadata = {
  title:{
    default: "Elevra",
    template: "%s | Elevra",
  },
  description: "Stay informed with Elevra Community — your source for local polls, election results, and community voting insights across all counties in the United States. Discover how your county is voting and engage with real-time local poll data.",
  icons:{
    icon: "/favicon.ico",
  },
  keywords: [
    "local polls",
    "election results",
    "county polls",
    "US local elections",
    "community voting insights",
    "polling data by county",
    "Elevra polls",
    "state election polls",
    "voter engagement",
    "community elections"
  ],
  openGraph: {
    title: "Elevra Community | Local Polls & Election Results Across US Counties",
    description: "Track local polls and election results across all US counties with Elevra Community. Stay informed, see how your county is voting, and engage with your community.",
    url: "https://www.elevracommunity.com",
    siteName: "Elevra Community",
    images: [
      {
        url: "/Elevra.png",
        width: 1200,
        height: 630,
        alt: "Elevra Community Local Polls Across US Counties"
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevra Community | Local Polls Across US Counties",
    description: "Discover real-time local poll data and election results in your county with Elevra Community. Empowering communities through insights.",
    images: ["/Elevra.png"],
    site: "@ElevraCommunity",
    creator: "@ElevraCommunity",
  },
  metadataBase: new URL("https://www.elevracommunity.com"),
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
