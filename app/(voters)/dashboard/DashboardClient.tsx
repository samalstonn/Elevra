"use client";

import { Button } from "@/components/ui/button";
import { Decimal } from "@prisma/client/runtime/library";
import router from "next/router";

type Donation = {
  id: number;
  amount: Decimal;
  paidAt: string | null;
  candidate: {
    id: number;
    name: string;
    party: string;
    position: string;
    city: string;
    state: string;
    slug: string;
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
    totalCandidatesSupported: number;
    donations: Donation[];
  };
};

const DashboardPageClient = ({ user, data }: Props) => {
  const stats = [
    {
      label: "Total Contributions",
      value: `$${data.totalDonations.toFixed(2)}`,
    },
    {
      label: "Candidates Supported",
      value: `${data.totalCandidatesSupported}`,
    },
    {
      label: "Local Impact Score",
      value: `${(data.totalDonations * 0.01).toFixed(2)}%`,
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {user.firstName || user.username || "User"}! Track your
          contributions and maximize your impact.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-6 bg-gray-100 border rounded-xl shadow-md flex flex-col items-center justify-center text-center"
          >
            <h2 className="text-4xl font-bold text-purple-600 mb-2">
              {stat.value}
            </h2>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Your Recent Contributions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.donations.length === 0 ? (
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">No Donations Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                Support Candidates and campaigns by donating to their causes.
                Your contributions make a difference in local elections.
              </p>
            </div>
          ) : (
            data.donations.map((donation) => (
              <div
                key={donation.id}
                className="p-6 bg-gray-100 border rounded-xl shadow-md"
              >
                <h3 className="text-xl font-bold mb-2">
                  {donation.candidate.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Contributed ${Number(donation.amount).toFixed(2)} to{" "}
                  {donation.candidate.position} in {donation.candidate.city},{" "}
                  {donation.candidate.state}.
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Status:{" "}
                  {donation.paidAt
                    ? `Paid on ${new Date(
                        donation.paidAt
                      ).toLocaleDateString()}`
                    : "Pending"}
                </p>
                <Button
                  variant="purple"
                  onClick={() =>
                    router.push(`/candidate/${donation.candidate.slug}`)
                  }
                >
                  Visit Campaign
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPageClient;
