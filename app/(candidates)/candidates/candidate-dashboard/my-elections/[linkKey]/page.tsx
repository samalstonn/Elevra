"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import ContentBlocksEditor from "../ContentBlocksEditor";
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
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/lib/usePageTitle";
import { decodeEditorLinkKey } from "../utils";

interface EditorPageProps {
  params: Promise<{
    linkKey: string;
  }>;
}

export default function MyPageEditor({ params }: EditorPageProps) {
  usePageTitle("Candidate Dashboard – Public Campaign Page");
  const { toast } = useToast();
  const router = useRouter();
  const { linkKey } = use(params);

  const {
    data: candidateData,
    electionLinks = [],
    error,
    isLoading,
  } = useCandidate();

  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const decodedLinkKey = useMemo(() => decodeEditorLinkKey(linkKey), [linkKey]);
  const activeElectionId = decodedLinkKey?.electionId ?? null;

  // Show tutorial on first load unless the user opted out
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hide = localStorage.getItem("mypage_tutorial_hide");
    const tourStep = localStorage.getItem("elevra_tour_step");
    if (hide !== "true" && !tourStep) setShowTutorial(true);
  }, []);
  const closeTutorial = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("mypage_tutorial_hide", "true");
    }
    setShowTutorial(false);
  };

  const activeLink = electionLinks.find(
    (link) => link.electionId === activeElectionId
  );

  useEffect(() => {
    if (!activeLink || typeof window === "undefined") {
      return;
    }

    const hasShownToast =
      sessionStorage.getItem("electionEditorBugToastShown") === "true";

    if (!hasShownToast) {
      toast({
        title: "We\u2019re working on an issue",
        description:
          "We\u2019re experiencing a bug where edits to this page might not send correctly. Our team is on it and we\u2019ll let you know as soon as it\u2019s fixed.",
        className: "border-yellow-300 bg-yellow-50 text-yellow-900",
      });
      sessionStorage.setItem("electionEditorBugToastShown", "true");
    }
  }, [activeLink, toast]);

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

  if (!decodedLinkKey) {
    return (
      <Alert variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Invalid Editing Link</AlertTitle>
        <AlertDescription>
          The page link you used is not recognized. Please choose an election
          from the preview page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (candidateData.slug !== decodedLinkKey.candidateSlug) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Editing Link Mismatch</AlertTitle>
        <AlertDescription>
          This editing link does not belong to your account. Please return to
          your dashboard and open the editor from your own election list.
        </AlertDescription>
      </Alert>
    );
  }

  if (!activeLink) {
    return (
      <Alert variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Election Not Found</AlertTitle>
        <AlertDescription>
          We couldn&apos;t find this election on your account. Please ensure you
          have joined it from the My Elections tab.
        </AlertDescription>
      </Alert>
    );
  }

  const electionId = activeLink.electionId;

  return (
    <>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <div className="w-full max-w-4xl mx-auto min-w-0">
          <div className="mb-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                router.push("/candidates/candidate-dashboard/my-elections")
              }
              className="p-3 text-purple-600 hover:text-purple-700"
            >
              ← Back to Overview
            </Button>
            <h1 className="text-3xl font-semibold mt-2">
              {activeLink.election?.position ?? "Election Webpage"}
            </h1>
            <p className="text-sm text-gray-500">
              {activeLink.election?.city ?? ""}
              {activeLink.election?.city && activeLink.election?.state
                ? ", "
                : ""}
              {activeLink.election?.state ?? ""}
            </p>
          </div>
          <ContentBlocksEditor
            candidateSlug={candidateData.slug}
            initialBlocks={activeLink.ContentBlock ?? []}
            onSave={async (blocks, staticIds) => {
              // Only send blocks that were actually updated
              blocks = blocks.filter((b) => !staticIds.has(b.id));
              try {
                const res = await fetch("/api/v1/contentblocks/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    candidateId: candidateData.id,
                    electionId,
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
                  title: "Content saved",
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
              We’ve loaded an editable premade template with example text to
              help you build your public campaign page quickly.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click on any text to edit it directly.</li>
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
            Don&apos;t show me again
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
