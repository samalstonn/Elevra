import React from "react";

interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export function TabButton({ children, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-6 text-lg font-medium border-b-2 transition-colors ${
        active 
          ? "border-purple-900 text-purple-900" 
          : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
} 