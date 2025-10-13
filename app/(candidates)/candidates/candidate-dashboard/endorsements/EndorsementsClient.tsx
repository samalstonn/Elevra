"use client";

import React, { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { UserCircle2 } from "lucide-react";

export type Endorsement = {
  id: number;
  endorserName: string;
  relationshipDescription?: string | null;
  content: string;
  createdAt: string;
};

type Props = {
  user: {
    id: string;
    firstName: string | null;
    username: string | null;
    imageUrl: string;
  };
  data: {
    totalEndorsements: number;
    endorsements: Endorsement[];
  };
};

export default function CandidateEndorsementsClient({ user, data }: Props) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>(
    data.endorsements
  );
  const [total, setTotal] = useState<number>(data.totalEndorsements);

  const handleDelete = async (endorsementId: number) => {
    try {
      const res = await fetch("/api/endorsement", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endorsementId, clerkUserId: user.id }),
      });
      if (res.ok) {
        setEndorsements((prev) => prev.filter((e) => e.id !== endorsementId));
        setTotal((prev) => prev - 1);
      } else {
        console.error("Failed to delete endorsement", await res.json());
      }
    } catch (err) {
      console.error("Error deleting endorsement", err);
    }
  };

  const stats = [
    {
      label: "Total Endorsements Received",
      value: total.toString(),
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Endorsements Overview
        </h1>
        <p className="text-gray-600">
          Welcome, {user.firstName || user.username || "Candidate"}! Here&apos;s
          a summary of endorsements you&apos;ve received.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Recent Endorsements
        </h2>
        {endorsements.length === 0 ? (
          <div className="p-6 border border-gray-200 rounded-xl text-center text-gray-500">
            No endorsements yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {endorsements.map((endorsement) => (
              <li
                key={endorsement.id}
                className="relative p-4 border border-gray-200 rounded-xl flex items-start gap-4 bg-white shadow-sm"
              >
                <button
                  onClick={() => handleDelete(endorsement.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  aria-label="Delete endorsement"
                >
                  &times;
                </button>
                <div className="rounded-full bg-gray-100 p-2">
                  <UserCircle2 className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {endorsement.endorserName}
                  </p>
                  {endorsement.relationshipDescription && (
                    <p className="text-sm text-gray-500">
                      {endorsement.relationshipDescription}
                    </p>
                  )}
                  <p className="mt-2 text-gray-700">{endorsement.content}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(endorsement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
