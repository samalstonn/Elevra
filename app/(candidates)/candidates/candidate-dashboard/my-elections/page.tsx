"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

import SearchBar from "@/components/ResultsSearchBar";
import { ElectionLinkWithElection, useCandidate } from "@/lib/useCandidate";
import { buildEditorPath, summarizeBlocks, type BlockSnippet } from "./utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TourModal from "@/components/tour/TourModal";
import { usePageTitle } from "@/lib/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";
import type { ContentBlock } from "@prisma/client";

export default function ProfileSettingsPage() {
  usePageTitle("Candidate Dashboard – Campaigns");
  const { toast } = useToast();
  const {
    data: candidateData,
    electionLinks = [],
    error,
    isLoading,
    refresh,
  } = useCandidate();

  const [showAddElectionModal, setShowAddElectionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSelection, setTemplateSelection] =
    useState<TemplateChoice>("weinstein");
  const [activeTemplateLink, setActiveTemplateLink] =
    useState<ElectionLinkWithElection | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [pendingTemplateElectionId, setPendingTemplateElectionId] = useState<
    number | null
  >(null);
  const router = useRouter();
  // Tour state (Step 3)
  const [showStep3, setShowStep3] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => {
    try {
      const optOut = localStorage.getItem("elevra_tour_opt_out");
      if (optOut === "1") return;
      const step = localStorage.getItem("elevra_tour_step");
      const forceTour = searchParams.get("tour") === "1";
      if (step === "3" || forceTour) setShowStep3(true);
    } catch {}
  }, [searchParams]);

  const skipTour = () => {
    try {
      localStorage.setItem("elevra_tour_opt_out", "1");
      localStorage.removeItem("elevra_tour_step");
    } catch {}
    setShowStep3(false);
    router.push("/candidates/candidate-dashboard");
  };

  const nextToPublicPage = () => {
    try {
      localStorage.setItem("elevra_tour_step", "4");
    } catch {}
    setShowStep3(false);
    if (candidateData && electionLinks.length > 0) {
      const href = `${buildEditorPath(
        candidateData.slug,
        electionLinks[0].electionId
      )}?tour=1`;
      router.push(href);
    } else {
      router.push("/candidates/candidate-dashboard/my-elections");
    }
  };
  const backToProfile = () => {
    try {
      localStorage.setItem("elevra_tour_step", "2");
    } catch {}
    setShowStep3(false);
    router.push("/candidates/candidate-dashboard/my-profile?tour=1");
  };

  const handleElectionSelect = async (
    items: { id: string | number } | Array<{ id: string | number }>
  ) => {
    if (!candidateData) return;
    const parsed = (Array.isArray(items) ? items : [items]) as Array<{
      id: string | number;
    }>;
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
          setShowAddElectionModal(false);
          setPendingTemplateElectionId(electionId);
          refresh();
        }
      }
    }
  };

  const openTemplateModal = (link: ElectionLinkWithElection) => {
    const hasCustomBlocks = Boolean(
      link.ContentBlock &&
        link.ContentBlock.length > 0 &&
        !isWeinsteinTemplateUnmodified(link.ContentBlock)
    );
    setTemplateSelection(hasCustomBlocks ? "current" : "weinstein");
    setActiveTemplateLink(link);
    setShowTemplateModal(true);
  };

  const handleTemplateDialogChange = (open: boolean) => {
    if (isApplyingTemplate) return;
    setShowTemplateModal(open);
    if (!open) {
      setActiveTemplateLink(null);
      setTemplateSelection("weinstein");
      setPendingTemplateElectionId(null);
    }
  };

  const handleCustomizeTemplate = async () => {
    if (!candidateData || !activeTemplateLink) return;
    if (!candidateData.slug) {
      toast({
        variant: "destructive",
        title: "Missing campaign URL",
        description: "Please add a campaign slug before editing templates.",
      });
      return;
    }

    const editPath = buildEditorPath(
      candidateData.slug,
      activeTemplateLink.electionId
    );

    if (templateSelection === "weinstein") {
      setIsApplyingTemplate(true);
      try {
        const response = await fetch("/api/v1/contentblocks/apply-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: candidateData.id,
            electionId: activeTemplateLink.electionId,
            templateKey: "WEINSTEIN",
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to apply template");
        }

        refresh();
      } catch (error) {
        console.error("Error applying template", error);
        toast({
          variant: "destructive",
          title: "Could not apply template",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a moment.",
        });
        setIsApplyingTemplate(false);
        return;
      }
      setIsApplyingTemplate(false);
    }

    setShowTemplateModal(false);
    setActiveTemplateLink(null);
    setTemplateSelection("weinstein");
    router.push(editPath);
  };

  useEffect(() => {
    if (!pendingTemplateElectionId) return;
    const link = electionLinks.find(
      (l) => l.electionId === pendingTemplateElectionId
    );
    if (!link) return;
    setPendingTemplateElectionId(null);
    openTemplateModal(link);
  }, [pendingTemplateElectionId, electionLinks]);

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
  const activeBlocks = activeTemplateLink?.ContentBlock;
  const activeIsWeinsteinOnly = isWeinsteinTemplateUnmodified(activeBlocks);
  const activeHasCustomBlocks = Boolean(
    activeBlocks && activeBlocks.length > 0 && !activeIsWeinsteinOnly
  );

  const currentTemplateSnippets =
    activeHasCustomBlocks && activeTemplateLink
      ? summarizeBlocks(activeTemplateLink.ContentBlock)
      : [];

  const templateCards: TemplateCardDefinition[] = [];

  if (activeTemplateLink) {
    if (activeHasCustomBlocks) {
      templateCards.push({
        key: "current",
        title: "My Current Layout",
        description: "Keep editing the content you’ve already customized.",
        snippets:
          currentTemplateSnippets.length > 0
            ? currentTemplateSnippets
            : CURRENT_TEMPLATE_FALLBACK,
      });
    }
    templateCards.push({
      key: "weinstein",
      title: "Weinstein Template",
      description:
        "Reset to the storytelling layout featuring sections for your biography, platform, and visuals.",
      snippets: WEINSTEIN_PREVIEW,
    });
  }

  return (
    <div className="space-y-6">
      {/* Tour: Step 3 (Campaigns) */}
      <TourModal
        open={showStep3}
        onOpenChange={setShowStep3}
        title="Campaigns (Step 3 of 5)"
        backLabel="Back"
        onBack={backToProfile}
        primaryLabel="Next: Public Campaign Page"
        onPrimary={nextToPublicPage}
        secondaryLabel="Skip tour"
        onSecondary={skipTour}
      >
        <p>Use the search bar to find the election you&apos;re running in.</p>
        <p>
          <strong>Once added,</strong> you can customize your{" "}
          <strong>Election Webpage</strong> for each election and get voters
          excited about your run.
        </p>
        <p>
          Tip: No need to worry about starting from scratch! We have templates
          to help you get started.
        </p>
      </TourModal>
      <div className="mb-6">
        <div className="w-full">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {(electionLinks.length > 0 ? electionLinks : [null]).map((link) => {
              if (!link) {
                return (
                  <article
                    key="placeholder-current"
                    className="flex h-full flex-col justify-between rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 shadow-sm"
                  >
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-700">
                          Add Your First Election
                        </h2>
                        <p className="text-sm text-gray-500">
                          Join an election to unlock your personalized campaign
                          page.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="h-4" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="h-8" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="h-8" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAddElectionModal(true)}
                    >
                      Add election
                    </Button>
                  </article>
                );
              }

              const snippets = summarizeBlocks(link.ContentBlock);
              const resultsHref = buildResultsHref(link);

              return (
                <article
                  key={link.electionId}
                  className="flex h-full flex-col justify-between rounded-xl border bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {link.election?.position ?? "Election"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {link.election?.city ?? ""}
                        {link.election?.city && link.election?.state
                          ? ", "
                          : ""}
                        {link.election?.state ?? ""}
                      </p>
                    </div>

                    {snippets.length > 0 ? (
                      <div className="space-y-3">
                        {snippets.map((snippet, snippetIndex) => (
                          <div
                            key={`${link.electionId}-${snippet.label}-${snippetIndex}`}
                          >
                            <span className="text-[10px] uppercase tracking-wide text-purple-500">
                              {snippet.label}
                            </span>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                              {snippet.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        You haven’t customized this election yet. Jump into the
                        editor to personalize your template.
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {candidateData.slug ? (
                      <Button
                        variant="purple"
                        size="sm"
                        onClick={() => openTemplateModal(link)}
                      >
                        Edit Page
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Missing slug
                      </Button>
                    )}
                    {resultsHref ? (
                      <Button asChild variant="secondary" size="sm">
                        <Link href={resultsHref}>View Election</Link>
                      </Button>
                    ) : null}
                    <Button
                      variant="destructive"
                      size="sm"
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
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
            <article className="flex h-full flex-col justify-between rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/60 p-6 shadow-sm backdrop-blur transition hover:border-purple-300">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-purple-700">
                    Past Elections
                  </h2>
                  <p className="text-sm text-purple-500">
                    Completed campaigns will appear here automatically.
                  </p>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-purple-200/80" />
                  <Skeleton className="h-4 w-full bg-purple-200/80" />
                  <Skeleton className="h-4 w-2/3 bg-purple-200/80" />
                </div>
              </div>
              <p className="mt-6 text-xs text-purple-400">
                Once an election ends, it moves into your political archive!
              </p>
            </article>
          </div>
        </div>
      </div>
      <Dialog
        open={showTemplateModal}
        onOpenChange={handleTemplateDialogChange}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              {activeTemplateLink?.election?.position
                ? `Pick the layout for your ${activeTemplateLink.election.position} page.`
                : "Pick the layout for this election page."}
            </DialogDescription>
          </DialogHeader>
          {!activeHasCustomBlocks ? (
            <p className="rounded-md border border-dashed border-purple-200 bg-purple-50 px-4 py-3 text-xs text-purple-700">
              You haven’t customized this election yet. We’ll start you with the
              Weinstein template so you can personalize it in the editor.
            </p>
          ) : null}
          <div
            className={cn(
              "mt-4 grid gap-4",
              templateCards.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"
            )}
          >
            {templateCards.map((card) => {
              const isSelected = templateSelection === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setTemplateSelection(card.key)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/40"
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {card.title}
                    </p>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full border",
                        isSelected
                          ? "border-purple-600 bg-purple-600"
                          : "border-gray-300 bg-white"
                      )}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {card.description}
                  </p>
                  <div className="mt-3 space-y-2">
                    {card.snippets.map((snippet, index) => (
                      <div key={`${card.key}-${snippet.label}-${index}`}>
                        <span className="text-[10px] uppercase tracking-wide text-purple-500">
                          {snippet.label}
                        </span>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {snippet.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleTemplateDialogChange(false)}
              disabled={isApplyingTemplate}
            >
              Cancel
            </Button>
            <Button
              variant="purple"
              onClick={handleCustomizeTemplate}
              disabled={isApplyingTemplate || templateCards.length === 0}
            >
              {isApplyingTemplate ? "Applying..." : "Customize Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddElectionModal}
        onOpenChange={setShowAddElectionModal}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Find an Election</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-4">
            Search by city, state, or position to link your campaign.
          </p>
          <SearchBar
            placeholder="Search for elections..."
            apiEndpoint="/api/elections/search"
            shadow={false}
            onResultSelect={handleElectionSelect}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TemplateChoice = "current" | "weinstein";

type TemplateCardDefinition = {
  key: TemplateChoice;
  title: string;
  description: string;
  snippets: BlockSnippet[];
};

const WEINSTEIN_PREVIEW: BlockSnippet[] = [
  {
    label: "Heading",
    text: "Lead with a bold introduction that highlights your race and story.",
  },
  {
    label: "List",
    text: "Spotlight your priorities with ready-made talking points.",
  },
  {
    label: "Image",
    text: "Feature visuals for your campaign signs, portrait, or videos.",
  },
];

const CURRENT_TEMPLATE_FALLBACK: BlockSnippet[] = [
  {
    label: "Layout",
    text: "Continue editing your saved sections and content blocks.",
  },
];

function isWeinsteinTemplateUnmodified(blocks?: ContentBlock[] | null) {
  if (!blocks || blocks.length !== davidWeinsteinTemplate.length) {
    return false;
  }

  const templateByOrder = new Map(
    davidWeinsteinTemplate.map((block) => [block.order, block])
  );

  for (const block of blocks) {
    const templateBlock = templateByOrder.get(block.order);
    if (!templateBlock) {
      return false;
    }

    const createdAt = new Date(block.createdAt);
    const updatedAt = new Date(block.updatedAt);
    if (
      Number.isNaN(createdAt.getTime()) ||
      Number.isNaN(updatedAt.getTime())
    ) {
      return false;
    }
    if (createdAt.getTime() !== updatedAt.getTime()) {
      return false;
    }

    if (!areBlocksEquivalent(block, templateBlock)) {
      return false;
    }
  }

  return true;
}

function areBlocksEquivalent(
  block: ContentBlock,
  templateBlock: (typeof davidWeinsteinTemplate)[number]
) {
  if (block.type !== templateBlock.type) return false;
  if ((block.color ?? null) !== (templateBlock.color ?? null)) return false;
  if ((block.level ?? null) !== (templateBlock.level ?? null)) return false;
  if ((block.text ?? null) !== (templateBlock.text ?? null)) return false;
  if ((block.body ?? null) !== (templateBlock.body ?? null)) return false;
  if ((block.listStyle ?? null) !== (templateBlock.listStyle ?? null)) {
    return false;
  }
  if (!areStringArraysEqual(block.items, templateBlock.items)) return false;
  if ((block.imageUrl ?? null) !== (templateBlock.imageUrl ?? null)) {
    return false;
  }
  if ((block.videoUrl ?? null) !== (templateBlock.videoUrl ?? null)) {
    return false;
  }
  if ((block.thumbnailUrl ?? null) !== (templateBlock.thumbnailUrl ?? null)) {
    return false;
  }
  if ((block.caption ?? null) !== (templateBlock.caption ?? null)) {
    return false;
  }

  return true;
}

function areStringArraysEqual(
  a: string[] | null | undefined,
  b: string[] | null | undefined
) {
  const normalizedA = Array.isArray(a) ? a : null;
  const normalizedB = Array.isArray(b) ? b : null;

  if (!normalizedA && !normalizedB) return true;
  if (!normalizedA || !normalizedB) return false;
  if (normalizedA.length !== normalizedB.length) return false;

  for (let i = 0; i < normalizedA.length; i += 1) {
    if (normalizedA[i] !== normalizedB[i]) return false;
  }

  return true;
}

function buildResultsHref(link: ElectionLinkWithElection) {
  const { election, electionId } = link;

  if (!election?.city || !election?.state) {
    return null;
  }

  const search = new URLSearchParams({
    city: election.city,
    state: election.state,
    electionID: String(electionId),
  });

  return `/results?${search.toString()}`;
}
