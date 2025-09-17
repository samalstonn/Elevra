import React from "react";

type EmptyStateProps = {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
};

export function EmptyState({ primary, secondary, className }: EmptyStateProps) {
  return (
    <div
      className={
        `border border-dashed rounded p-6 bg-white/70 text-center ` +
        (className || "")
      }
    >
      <p className="text-gray-600 text-sm">{primary}</p>
      {secondary ? (
        <p className="text-gray-500 text-xs mt-2">{secondary}</p>
      ) : null}
    </div>
  );
}

