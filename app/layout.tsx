import LayoutClient from "./(layout)/LayoutClient";

export const metadata = {
  title: "Elevra",
  description: "Your platform for connecting with top talent",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
