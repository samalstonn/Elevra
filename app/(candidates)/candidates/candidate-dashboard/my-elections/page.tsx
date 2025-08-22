"use client";

import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

import SearchBar from "@/components/ResultsSearchBar";
import { useCandidate } from "@/lib/useCandidate";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  const [showJoinedModal, setShowJoinedModal] = useState(false);

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
      <h1 className="text-3xl font-semibold">My Elections</h1>
      {/* <p className="text-sm text-gray-500 mt-2 mb-2 max-w-2xl">
        Add elections you are participating in. Manage your web page and content
        for each election.
      </p> */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Election</h2>
        <p className="text-sm text-gray-500 mt-2 mb-4 max-w-2xl">
          Search for elections by city, state, or position.
        </p>
        <SearchBar
          placeholder="Search for elections..."
          apiEndpoint="/api/elections/search"
          shadow={false}
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
                  setShowJoinedModal(true);
                  refresh();
                }
              }
            }
          }}
        />
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Manage Your Elections</h2>
        {electionLinks.length > 0 ? (
          <div className="w-full">
            <div className="-mx-4 md:mx-0 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Election
                    </th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      City
                    </th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      State
                    </th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {electionLinks.map((link) => (
                    <tr key={link.electionId} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm text-gray-900 overflow-wrap-anywhere">
                        {link.election?.position ?? "Unknown"}
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {link.election?.city ?? "—"}
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {link.election?.state ?? "—"}
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm">
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
                          className="ml-2 px-2 md:px-3 py-1 bg-red-600 text-white rounded text-xs md:text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-purple-50 rounded">
              <p className="text-sm text-gray-700">
                You can customize your public campaign web page in the{" "}
                <strong>Public Campaign Page</strong> tab to the left. Share
                your background, platform, and connect with voters - all in one
                place.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4 max-w-2xl">
            You are not currently associated with any elections. Please look for
            your election in the search bar above.
          </p>
        )}
        <h2 className="text-xl font-semibold mt-4 mb-2">Past Elections</h2>
        <p className="text-sm text-gray-500 mb-4 max-w-2xl">
          You have not previously participated in any elections. Join an
          election above and start building your campaign page. After your
          campaign ends, it will appear here for your records.
        </p>
      </div>
      {/* Success join modal */}
      <Dialog open={showJoinedModal} onOpenChange={setShowJoinedModal}>
        <DialogContent className="max-w-sm">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={() => setShowJoinedModal(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader>
            <DialogTitle className="text-lg">Election Joined!</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-700">
            You have successfully joined this election. You can customize your
            public campaign page next.
          </p>

          <DialogFooter className="flex justify-start gap-2 mt-4">
            <Link href="/candidates/candidate-dashboard/my-page">
              <Button variant="outline" className="text-sm">
                Customize Page
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
