"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

import SearchBar from "@/components/ResultsSearchBar";
import { ElectionLinkWithElection, useCandidate } from "@/lib/useCandidate";
import {
  buildEditorPath,
  buildResultsHref,
  ELEVRA_STARTER_TEMPLATE_PREVIEW,
  SIMPLE_TEMPLATE_PREVIEW,
  summarizeBlocks,
  TemplateCardDefinition,
  TemplateChoice,
  /* type BlockSnippet, */
} from "./utils";

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

export default function ProfileSettingsPage() {
  usePageTitle("Candidate Dashboard – Campaign");
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
  type TemplateChoiceNullable = TemplateChoice | null;
  const [templateSelection, setTemplateSelection] =
    useState<TemplateChoiceNullable>(null);
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

  const finishTour = () => {
    try {
      localStorage.removeItem("elevra_tour_step");
    } catch {}
    setShowStep3(false);
  };
  const backToProfile = () => {
    try {
      localStorage.setItem("elevra_tour_step", "2");
    } catch {}
    setShowStep3(false);
    router.push("/candidates/candidate-dashboard/my-profile?tour=1");
  };

  // UPDATE: do not POST here; just remember the id and open the template modal.
  const handleElectionSelect = (
    items: { id: string | number } | Array<{ id: string | number }>
  ) => {
    const first = (Array.isArray(items) ? items[0] : items) as {
      id: string | number;
    };
    const electionId = Number(first.id);

    // Stash pending election and close the search dialog
    setPendingTemplateElectionId(electionId);
    setShowAddElectionModal(false);

    openTemplateModalWithElectionId(electionId);
  };

  const openTemplateModal = (link: ElectionLinkWithElection) => {
    setTemplateSelection(null);
    setActiveTemplateLink(link);
    setShowTemplateModal(true);
  };

  const goToEditor = (link: ElectionLinkWithElection) => {
    if (!candidateData?.slug) return;

    const editPath = buildEditorPath(candidateData.slug, link.electionId);
    router.push(editPath);
  };

  const openTemplateModalWithElectionId = (electionId: number) => {
    // Pass a "virtual" link with no ContentBlock so hasCustomBlocks === false
    const virtualLink = {
      electionId,
      ContentBlock: [], // <- important so isElevraStarterTemplateUnmodified(...) works
    } as unknown as ElectionLinkWithElection;

    openTemplateModal(virtualLink);
  };

  const handleTemplateDialogChange = (open: boolean) => {
    if (isApplyingTemplate) return;
    setShowTemplateModal(open);
    if (!open) {
      setActiveTemplateLink(null);
      setPendingTemplateElectionId(null);
    }
  };

  // UPDATE: handleCustomizeTemplate ensures the election link exists (creating it if needed)
  // and then applies the template and routes to the editor.
  const handleCustomizeTemplate = async () => {
    if (!candidateData) return;

    // Use the electionId from the active link if present, otherwise fall back to pending.
    const electionId =
      activeTemplateLink?.electionId ??
      (pendingTemplateElectionId != null
        ? Number(pendingTemplateElectionId)
        : null);

    if (!electionId) {
      toast({
        variant: "destructive",
        title: "No election selected",
        description: "Please pick an election before customizing a page.",
      });
      return;
    }
    if (!candidateData.slug) {
      toast({
        variant: "destructive",
        title: "Missing campaign URL",
        description: "Please add a campaign slug before editing templates.",
      });
      return;
    }

    const key = templateSelection || "custom";

    // Ensure an election link exists (create it only now, when the user commits by clicking Customize)
    const hasLinkAlready = !!electionLinks.find(
      (l) => l.electionId === electionId
    );
    if (!hasLinkAlready) {
      try {
        const res = await fetch("/api/electionlinks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: candidateData.id,
            electionId,
            key,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create election link");
        }

        // Refresh local state to reflect the new link
        refresh();
      } catch (error) {
        console.error("Error creating election link", error);
        toast({
          variant: "destructive",
          title: "Could not link election",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a moment.",
        });
        return;
      }
    }

    const editPath = buildEditorPath(candidateData.slug, electionId);

    // Apply template if the starter template is selected
    if (templateSelection === "elevraStarterTemplate") {
      setIsApplyingTemplate(true);
      try {
        const response = await fetch("/api/v1/contentblocks/apply-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: candidateData.id,
            electionId,
            templateKey: "ELEVRA_STARTER_TEMPLATE",
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

    // Close template modal, clear selection state, navigate to editor
    setShowTemplateModal(false);
    setActiveTemplateLink(null);
    setTemplateSelection(null);
    setPendingTemplateElectionId(null);
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

  const templateCards: TemplateCardDefinition[] = [];

  if (activeTemplateLink) {
    templateCards.push({
      key: "simpleTemplate",
      title: "Simple Template",
      description: "Basic Template to Reach Out to Voters",
      snippets: SIMPLE_TEMPLATE_PREVIEW,
    });
    templateCards.push({
      key: "elevraStarterTemplate",
      title: "Elevra Starter Template",
      description: "Introduce voters to your campaign",
      snippets: ELEVRA_STARTER_TEMPLATE_PREVIEW,
    });
    templateCards.push({
      key: "custom",
      title: "Custom Campaign",
      description: "Customize your campaign page from scratch",
      snippets: [],
    });
  }

  return (
    <div className="space-y-6">
      {/* Tour: Step 3 (Campaign) */}
      <TourModal
        open={showStep3}
        onOpenChange={setShowStep3}
        title="Campaign (Step 3 of 3)"
        backLabel="Back"
        onBack={backToProfile}
        primaryLabel="Finish Tour"
        onPrimary={finishTour}
        secondaryLabel="Skip tour"
        onSecondary={skipTour}
      >
        <p>
          Use the actions here to manage how voters see the most important part
          of the public part of Elevra, <strong>your campaign</strong>.
        </p>
        <p>
          Tip: No need to start from scratch! Click{" "}
          <strong>Edit Campaign Page</strong> on the campaign card to launch one of 
          our templates.
        </p>
      </TourModal>

      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Your Public Campaign Pages
        </h1>
      </div>

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
                          Add Your First Campaign
                        </h2>
                        <p className="text-sm text-gray-500">
                          Create your campaign and unlock your personalized
                          campaign page.
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
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAddElectionModal(true)}
                    >
                      Find Election
                    </Button>
                  </article>
                );
              }

              const snippets = summarizeBlocks(link.ContentBlock);
              const hasCustomDoc = !!link.Document?.contentHtml;
              const docPreview = hasCustomDoc && link.Document
                ? link.Document.contentHtml
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                : "";
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
                    ) : hasCustomDoc ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-purple-500">
                            Custom Campaign
                          </span>
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                            {docPreview}
                          </p>
                        </div>
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
                        onClick={() => goToEditor(link)}
                      >
                        Edit Campaign Page
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
                      Delete Campaign
                    </Button>
                  </div>
                </article>
              );
            })}
            {/* Premium Campaign Card */}
            {/* <PremiumCampaignCard /> */}

            <article className="flex h-full flex-col justify-between rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/60 p-6 shadow-sm backdrop-blur transition hover:border-purple-300">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-purple-700">
                    Past Campaigns
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
                Once an election ends, your campaign moves into your political
                archive!
              </p>
            </article>
          </div>
        </div>
      </div>
      <Dialog
        open={showTemplateModal}
        onOpenChange={handleTemplateDialogChange}
      >
        <DialogContent className="template-dialog w-[80%] rounded-lg sm:w-full max-w-3xl max-h-[85vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              {activeTemplateLink?.election?.position
                ? `Pick the template for your ${activeTemplateLink.election.position} page.`
                : "Pick the template for this election page."}
            </DialogDescription>
          </DialogHeader>
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
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {card.title}
                      </p>
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full border flex-shrink-0",
                          isSelected
                            ? "border-purple-600 bg-purple-600"
                            : "border-gray-300 bg-white"
                        )}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {card.description}
                    </p>
                    <div className="flex-1 space-y-2">
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
              disabled={
                isApplyingTemplate ||
                templateCards.length === 0 ||
                !templateSelection
              }
            >
              {isApplyingTemplate
                ? "Applying..."
                : "Create and Customize Campaign Page"}
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
