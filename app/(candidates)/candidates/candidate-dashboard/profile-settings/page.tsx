"use client";

import React, { useState, useEffect } from "react";
import { CandidateDashboardData } from "@/types/candidate";
import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import SearchBar from "@/components/ResultsSearchBar";
import { ContentBlock, Election, ElectionLink } from "@prisma/client";
import ContentBlocksEditor from "./ContentBlocksEditor";

export type ElectionLinkWithElection = ElectionLink & {
  election: Election;
  ContentBlock?: ContentBlock[];
};

// Define an interface for the search result items
interface SearchResultItem {
  id: string | number; // Allow string or number as ID might come as string from API/component
  // Add other expected properties if known, e.g., name: string;
}

export default function ProfileSettingsPage() {
  const { userId, isLoaded } = useAuth();
  const [candidateData, setCandidateData] =
    useState<CandidateDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Holds a list of election links for this candidate
  const [electionLinks, setElectionLinks] = useState<
    ElectionLinkWithElection[]
  >([]);
  // (pendingElectionIds state removed)
  const [activeElectionId, setActiveElectionId] = useState<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Fetch candidate data only when Clerk is loaded and userId is available
    if (isLoaded && userId) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/candidate?clerkUserId=${userId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `Failed to fetch candidate data: ${res.statusText}`
            );
          }
          return res.json();
        })
        .then((data: CandidateDashboardData) => {
          setCandidateData(data);
          // Fetch election links for this candidate
          fetch(`/api/electionlinks?candidateId=${data.id}`)
            .then((res) => res.json())
            .then((links: ElectionLinkWithElection[]) => {
              setElectionLinks(links);
              setActiveElectionId(links[0]?.electionId ?? null);
            });
        })
        .catch((err) => {
          console.error("Error fetching candidate data:", err);
          setError(err.message || "Could not load profile data.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isLoaded && !userId) {
      // Handle case where user is loaded but not logged in (shouldn't happen with middleware)
      setError("User not authenticated.");
      setIsLoading(false);
    }
    // If Clerk is not loaded yet, isLoading remains true
  }, [userId, isLoaded]);

  // Determine the currently active election link
  const activeLink = electionLinks.find(
    (link) => link.electionId === activeElectionId
  );

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

  // Error State
  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Profile</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Candidate data not found (after loading and no error)
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
        <SearchBar
          placeholder="Search for elections..."
          apiEndpoint="/api/elections/search"
          shadow={false}
          multi
          onResultSelect={async (items) => {
            const parsed = (
              Array.isArray(items) ? items : [items]
            ) as SearchResultItem[];
            for (const item of parsed) {
              const electionId = Number(item.id);
              if (
                !electionLinks.find((link) => link.electionId === electionId) &&
                candidateData
              ) {
                const res = await fetch("/api/electionlinks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    candidateId: candidateData.id,
                    electionId,
                  }),
                });
                if (res.ok) {
                  const refreshed = await fetch(
                    `/api/electionlinks?candidateId=${candidateData.id}`
                  );
                  if (refreshed.ok) {
                    const newLinks: ElectionLinkWithElection[] =
                      await refreshed.json();
                    setElectionLinks(newLinks);
                    const newLink = newLinks.find(
                      (l) => l.electionId === electionId
                    );
                    if (newLink) setActiveElectionId(newLink.electionId);
                  }
                }
              }
            }
          }}
        />
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Your Elections</h2>
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
                  <button
                    onClick={() => setActiveElectionId(link.electionId)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={async () => {
                      if (!candidateData) return;
                      await fetch(
                        `/api/electionlinks/${candidateData.id}/${link.electionId}`,
                        { method: "DELETE" }
                      );
                      if (activeElectionId === link.electionId) {
                        const updatedLinks = electionLinks.filter(
                          (l) => l.electionId !== link.electionId
                        );
                        setElectionLinks(updatedLinks);
                        setActiveElectionId(
                          updatedLinks[0]?.electionId ?? null
                        );
                      } else {
                        setElectionLinks((prev) =>
                          prev.filter((l) => l.electionId !== link.electionId)
                        );
                      }
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
      </div>
      <h1 className="text-3xl font-bold text-gray-800">
        {activeLink?.election?.position
          ? `${activeLink.election.position}`
          : "Please Add an Election Above"}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="md:col-span-2">
          {activeElectionId != null && candidateData && (
            <ContentBlocksEditor
              initialBlocks={activeLink?.ContentBlock ?? []}
              onSave={async (blocks) => {
                try {
                  const res = await fetch("/api/v1/contentblocks/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      candidateId: candidateData.id,
                      electionId: activeElectionId,
                      blocks,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok || data.error) {
                    toast({
                      variant: "destructive",
                      title: "Error saving blocks",
                      description:
                        data.error || "Block limits exceeded or unknown error.",
                    });
                    return;
                  }
                  toast({
                    title: "Blocks saved",
                    description:
                      "Your election profile been updated successfully.",
                  });
                } catch (err) {
                  toast({
                    variant: "destructive",
                    title: "Network error",
                    description: "Unable to save content blocks.",
                  });
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
