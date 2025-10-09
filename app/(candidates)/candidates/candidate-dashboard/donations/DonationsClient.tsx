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
    totalDonationsNumber: number;
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
      value: data.totalDonationsNumber.toLocaleString(),
    },
    {
      label: "Average Donation Size",
      value:
        data.totalDonationsNumber > 0
          ? `$${(
              data.totalDonations / data.totalDonationsNumber
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "$0.00",
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Donations Overview</h1>
        <p className="text-muted-foreground">
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
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Recent Contributions
        </h2>
        {data.donations.length === 0 ? (
          <div className="p-6 border border-border/70 rounded-xl text-center text-muted-foreground">
            No donations received yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {data.donations.map((donation) => (
              <li
                key={donation.id}
                className="p-4 border border-border/70 rounded-xl flex items-center justify-between gap-4 bg-card shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-muted p-2">
                    <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {donation.donorName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {donation.donorEmail}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-300">
                    $
                    {Number(donation.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
