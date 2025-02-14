import type { Metadata } from "next";
import "./globals.css";
import { Button } from "../components/ui";
import { Inter } from 'next/font/google';
import Link from "next/link";
import Image from "next/image";

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
  <div className="flex flex-col">
    {/* Header Section */}
    
  <header className="w-full flex items-center justify-between pr-4">
    <Link href="/">
      <Image 
        src="/elevra-logo.png" 
        alt="Elevra Logo" 
        width={200} 
        height={100} 
        className="h-32 w-auto cursor-pointer"
        priority
      />
    </Link>
    <div>
      <Link href="/login">
        <Button variant="ghost" className="mr-2">Login</Button>
      </Link>
      <Link href="/dashboard">
        <Button>My Dashboard</Button>
      </Link>
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
