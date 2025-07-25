"use client";

import React, { useState, useEffect } from "react";
import ContentBlocksEditor from "./ContentBlocksEditor";
import { useToast } from "@/hooks/use-toast";
import { useCandidate } from "@/lib/useCandidate";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Show tutorial on every load unless the user opted out
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hide = localStorage.getItem("mypage_tutorial_hide");
    if (hide !== "true") {
      setShowTutorial(true);
    }
  }, []);
  const closeTutorial = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("mypage_tutorial_hide", "true");
    }
    setShowTutorial(false);
  };

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
    <>
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
                Please add an election first. Once you have an election, you
                will be able to select a template and edit your page.
              </p>
              <Button variant="purple" className="mx-auto" asChild>
                <a href="/candidates/candidate-dashboard/my-elections">
                  Add an election
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-md">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={closeTutorial}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader>
            <DialogTitle>Getting Started</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              We’ve loaded a premade template to help you build your public
              candidate page quickly.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click any text to edit it directly.</li>
              <li>Click on images to replace them or add short videos.</li>
              <li>
                Make sure to <strong>save</strong> your changes before leaving
                the page!
              </li>
            </ul>
            <h1 className="text-lg font-semibold text-purple-600 text-center">
              Good luck from the Elevra team!
            </h1>
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show me again
          </label>

          <DialogFooter className="flex justify-start mt-4">
            <Button onClick={closeTutorial} variant="purple">
              Start Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
