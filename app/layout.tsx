import LayoutClient from "./(layout)/LayoutClient";

export const metadata = {
  title: "Elevra",
  description: "Your platform for connecting with top talent",
  icons: {
    icon: "/favicon.ico",
  },
};
import { validateConfig } from "@/lib/config";

// Validate critical configuration on startup
validateConfig();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
