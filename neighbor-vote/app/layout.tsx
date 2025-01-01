import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeighborVote",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  <div className="bg-purple-300 min-h-screen flex flex-col">
    <header className="text-black py-4 w-full text-center">
      <Link href="/" className="text-3xl font-bold">
        NeighborVote
      </Link>
      <p className="mt-1">
        Discover your local leaders, learn their vision, and help turn their ideas into victories.
      </p>
    </header>

    <div className="flex-grow w-full flex items-center justify-center min-h-[75vh]">
        {children}
    </div>
    <div className="bg-white flex-grow w-full flex items-center justify-center min-h-[25vh]">
        <p> </p>
    </div>
    
    <footer className="bg-white text-black py-4 w-full text-center">
      <p>NeighborVote © 2024 | Empowering Local Democracy</p>
    </footer>
  </div>
</body>

      
    </html>
  );
}
