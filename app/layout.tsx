import LayoutClient from "./(layout)/LayoutClient";

export const metadata = {
  title: {
    default: "Elevra",
    template: "%s | Elevra",
  },
  description: "Your platform for connecting with top talent",
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
