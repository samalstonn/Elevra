"use client";

import { AuthProvider, useAuth } from "../app/lib/auth-context";
import { useState } from "react";
import Link from "next/link";
import AuthModal from "../components/AuthModal";
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavMenu />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

function NavMenu() {
  const { user, loading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const capitalizeName = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const extractInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="flex justify-between items-center p-4">
      {/* Elevra Branding - Top Left */}
      <Link href="/">
        <span className="text-3xl font-bold text-purple-900">Elevra</span>
      </Link>
  
      {/* Right Side Navigation */}
      <div className="flex items-center space-x-6">
        {/* Dashboard Button - Always Visible */}
        <button 
          className="px-6 py-2 text-lg font-semibold rounded-full bg-black text-white shadow-md hover:bg-gray-900 transition"
          onClick={() => {
            if (!user) setShowAuthModal(true);
          }}
        >
          <Link href={user ? "/dashboard" : "#"}>My Dashboard</Link>
        </button>
  
        {!loading && (
          user ? (
            <div className="relative group">
              {/* User Profile Section */}
              <Link href="/dashboard" className="h-12 flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition hover:bg-gray-100">
                {/* Profile Avatar */}
                <div className="w-10 h-10 flex items-center justify-center bg-red-600 text-white font-bold rounded-full">
                  {extractInitial(user.username)}
                </div>
                {/* Capitalized Name */}
                <span className="text-base font-semibold text-purple-900">
                  {capitalizeName(user.username)}
                </span>
              </Link>
  
              {/* Dropdown Menu - Appears on Hover */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="w-full text-left px-4 py-2 text-black hover:bg-gray-200"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            // Login Button
            <button 
              className="text-lg text-gray-700 font-medium hover:text-black transition"
              onClick={() => setShowAuthModal(true)}
            >
              Login
            </button>
          )
        )}
  
        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          initialMode={authMode}
        />
      </div>
    </div>
  );
}