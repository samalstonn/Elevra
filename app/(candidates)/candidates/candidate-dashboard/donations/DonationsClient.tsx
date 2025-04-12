"use client";

import { StatsCard } from "@/components/StatsCard";
import { UserCircle2 } from "lucide-react";

// Donation type
type Donation = {
  id: number;
  amount: number;
  paidAt: string | null;
  donorName: string;
  donorEmail: string;
  candidate: {
    id: number;
    name: string;
    party: string;
    position: string;
    state: string;
  };
};

type Props = {
  user: {
    firstName: string | null;
    username: string | null;
    imageUrl: string;
  };
  data: {
    totalDonations: number;
    totalContributions: number;
    donations: Donation[];
  };
};

export default function CandidateDonationsClient({ user, data }: Props) {
  const stats = [
    {
      label: "Total Donations Received",
      value: `$${data.totalDonations.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: "Individual Contributions",
      value: data.totalContributions.toLocaleString(),
    },
    {
      label: "Average Donation Size",
      value:
        data.totalContributions > 0
          ? `$${(data.totalDonations / data.totalContributions).toLocaleString(
              undefined,
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`
          : "$0.00",
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Donations Overview</h1>
        <p className="text-gray-600">
          Welcome, {user.firstName || user.username || "Candidate"}! Here&apos;s
          a summary of your campaign&apos;s contributions.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <StatsCard key={i} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Recent Contributions
        </h2>
        {data.donations.length === 0 ? (
          <div className="p-6 border border-gray-200 rounded-xl text-center text-gray-500">
            No donations received yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {data.donations.map((donation) => (
              <li
                key={donation.id}
                className="p-4 border border-gray-200 rounded-xl flex items-center justify-between gap-4 bg-white shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <UserCircle2 className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {donation.donorName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {donation.donorEmail}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-purple-600">
                    $
                    {Number(donation.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {donation.paidAt
                      ? new Date(donation.paidAt).toLocaleDateString()
                      : "Pending"}
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
