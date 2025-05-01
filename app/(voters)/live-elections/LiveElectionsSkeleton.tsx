'use client';
import React from 'react';

export default function LiveElectionsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg w-full" />
      ))}
    </div>
  );
}
