"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

import SearchBar from "@/components/ResultsSearchBar";
import { ContentBlock, Election, ElectionLink } from "@prisma/client";
import { useCandidate, ElectionLinkWithElection } from "@/lib/useCandidate";

interface SearchResultItem {
  id: string | number;
}

export default function ProfileSettingsPage() {
  const {
    data: candidateData,
    electionLinks = [],
    error,
    isLoading,
    refresh,
  } = useCandidate();

  const [activeElectionId, setActiveElectionId] = useState<number | null>(null);

  useEffect(() => {
    if (electionLinks.length === 0) {
      setActiveElectionId(null);
      return;
    }
    setActiveElectionId((prev) =>
      prev && electionLinks.some((l) => l.electionId === prev)
        ? prev
        : electionLinks[0].electionId
    );
  }, [electionLinks]);

  const activeLink = electionLinks.find(
    (link) => link.electionId === activeElectionId
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Profile</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!candidateData) {
    return (
      <Alert variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Profile Not Found</AlertTitle>
        <AlertDescription>
          Could not find a candidate profile associated with your account.
          Please ensure you have completed the initial setup or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Manage Elections</h2>
        <p className="text-sm text-gray-500 mt-2 mb-2">
          Add or remove elections you are participating in. Search for elections
          by position, city, or state. Once added, you can manage your profile
          and content for each election.
        </p>
        <SearchBar
          placeholder="Search for elections..."
          apiEndpoint="/api/elections/search"
          shadow={false}
          multi
          onResultSelect={async (items) => {
            if (!candidateData) return;
            const parsed = (
              Array.isArray(items) ? items : [items]
            ) as SearchResultItem[];
            for (const item of parsed) {
              const electionId = Number(item.id);
              if (!electionLinks.find((l) => l.electionId === electionId)) {
                const res = await fetch("/api/electionlinks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    candidateId: candidateData.id,
                    electionId,
                  }),
                });
                if (res.ok) {
                  refresh();
                }
              }
            }
          }}
        />
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Elections</h2>
        {electionLinks.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Election
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {electionLinks.map((link) => (
                <tr key={link.electionId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.election?.position ?? "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.election?.city ?? "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.election?.state ?? "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* <button
                onClick={() => setActiveElectionId(link.electionId)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Edit Profile
              </button> */}
                    <button
                      onClick={async () => {
                        if (!candidateData) return;
                        await fetch(
                          `/api/electionlinks/${candidateData.id}/${link.electionId}`,
                          {
                            method: "DELETE",
                          }
                        );
                        refresh();
                      }}
                      className="ml-2 px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            You are not currently associated with any elections. Please look for
            your election in the search bar above.
          </p>
        )}
        <h2 className="text-xl font-semibold mt-4 mb-2">Past Elections</h2>
        <p className="text-sm text-gray-500 mb-4">
          You have not previously participated in any elections. Join an
          election above and start building your profile. After your election
          ends, it will appear here for your records.
        </p>
      </div>
    </div>
  );
}
