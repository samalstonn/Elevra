import React from "react";

interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export function TabButton({
  children,
  active,
  onClick,
  className = "py-4 px-6 text-lg font-medium",
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${className} border-b-2 transition-colors ${
        active
          ? "border-purple-900 text-purple-900"
          : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}
