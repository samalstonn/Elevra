import type { Metadata } from "next";
import "./globals.css";
import { Button } from "../components/ui";
import { Inter } from 'next/font/google';

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
