"use client";

import React, { useState, useEffect } from "react";
import ContentBlocksEditor from "./ContentBlocksEditor";
import { useToast } from "@/hooks/use-toast";
import { useCandidate } from "@/lib/useCandidate";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function MyPage() {
  const { toast } = useToast();

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ContentBlocksEditor */}
      <div className="md:col-span-4">
        {activeElectionId != null && candidateData ? (
          <ContentBlocksEditor
            candidateSlug={candidateData.slug}
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
                console.error("Error saving content blocks:", err);
              }
            }}
          />
        ) : (
          <div>
            <h2 className="text-xl font-semibold mt-4 mb-2">
              No Election Selected
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Please add an election first. Once you have an election, you will
              be able to select a template and edit your page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
