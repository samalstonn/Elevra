import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Button } from "./components/ui";
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
  <div className=" flex flex-col">
    {/* Header Section */}
    <header className="w-full flex items-center justify-between p-4">
        <h1 className="text-3xl font-bold text-purple-900">Elevra</h1>
        <div>
          <Button variant="ghost" className="mr-2">Login</Button>
          <Button>Get started</Button>
        </div>
      </header>

    <div className="flex-grow w-full flex items-center justify-center min-h-[75vh]">
        {children}
    </div>
    {/* <div className="bg-white flex-grow w-full flex items-center justify-center min-h-[25vh]">
        <p> </p>
    </div> */}
    
{/* Footer Section */}
<footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200">
        &copy; {new Date().getFullYear()} Elevra 2025. All rights reserved.
      </footer>
  </div>
</body>

      
    </html>
  );
}
