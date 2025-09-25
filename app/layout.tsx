import LayoutClient from "./(layout)/LayoutClient";

export const metadata = {
  title: {
    default: "Elevra",
    template: "%s | Elevra",
  },
  description: "Local Elections, Simplified.",
  icons: {
    icon: "/favicon.ico",
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
