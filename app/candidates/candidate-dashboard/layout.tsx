"use client";
import React from "react";
import { DashboardNav } from "./components/DashboardNav";
import { useUser } from "@clerk/nextjs";

// Define the structure of the dashboard layout
export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser(); // Or useAuth, currentUser etc.
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {user?.firstName || "Candidate"}!
          </h2>
          {/* Maybe add user name/avatar here later */}
        </div>
        <div className="flex-1 overflow-y-auto">
          <DashboardNav />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
