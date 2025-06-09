import LayoutClient from "./(layout)/LayoutClient";
import { validateConfig } from "@/lib/config";

export const metadata = {
  title: "Elevra",
  description: "Your platform for connecting with top talent",
  icons: {
    icon: "/favicon.ico",
  },
};

validateConfig();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
