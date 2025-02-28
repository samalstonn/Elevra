import type { Metadata } from "next";
import "./globals.css";
import { Button } from "../components/ui";
import { Inter } from 'next/font/google';
import Link from "next/link";
import { AuthProvider } from "./lib/auth-context";
import NavMenu from "../components/NavMenu";

const inter = Inter({ subsets: ['latin'] });

export const metadata : Metadata = {
  title: 'Elevra',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {/* Header Section */}
            <header className="w-full flex items-center justify-between p-4">
              <Link href="/" className="text-3xl font-bold text-purple-900">
                Elevra
              </Link>
              <NavMenu />
            </header>

            <div className="flex-grow w-full flex items-center justify-center min-h-[75vh]">
              {children}
            </div>
            
            {/* Footer Section */}
            <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200">
              &copy; {new Date().getFullYear()} Elevra 2025. All rights reserved.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
