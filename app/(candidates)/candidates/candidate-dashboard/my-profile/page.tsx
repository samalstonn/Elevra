"use client";
import React, { useEffect, useState } from "react";
import { useCandidate } from "@/lib/useCandidate";
import { PhotoUploader } from "@/components/ProfilePhotoUploader";
import { useAuth } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Terminal } from "lucide-react";
import BasicProfileForm from "./BasicProfileForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import TourModal from "@/components/tour/TourModal";
import { usePageTitle } from "@/lib/usePageTitle";
import EducationAdder from "@/components/EducationAdder";
import { extractEducation } from "@/lib/education";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function BioSettingsPage() {
  usePageTitle("Candidate Dashboard – Profile");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const { data: candidateData, error, isLoading, refresh } = useCandidate();

  // Tour state (Step 2)
  const [showStep2, setShowStep2] = useState(false);
  useEffect(() => {
    try {
      const optOut = localStorage.getItem("elevra_tour_opt_out");
      if (optOut === "1") return;
      const step = localStorage.getItem("elevra_tour_step");
      const forceTour = searchParams.get("tour") === "1";
      if (step === "2" || forceTour) setShowStep2(true);
    } catch {}
  }, [searchParams]);

  const skipTour = () => {
    try {
      localStorage.setItem("elevra_tour_opt_out", "1");
      localStorage.removeItem("elevra_tour_step");
    } catch {}
    setShowStep2(false);
    // Show friendly opt-out on Overview next time
    router.push("/candidates/candidate-dashboard");
  };

  const nextToCampaign = () => {
    try {
      localStorage.setItem("elevra_tour_step", "3");
    } catch {}
    setShowStep2(false);
    router.push("/candidates/candidate-dashboard/my-elections?tour=1");
  };
  const backToOverview = () => {
    try {
      localStorage.setItem("elevra_tour_step", "1");
    } catch {}
    setShowStep2(false);
    router.push("/candidates/candidate-dashboard?tour=1");
  };

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
        <AlertDescription>{(error as Error).message}</AlertDescription>
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
    <div className="w-full h-full">
      {/* Tour: Step 2 (Profile) */}
      <TourModal
        open={showStep2}
        onOpenChange={setShowStep2}
        title="Profile (Step 2 of 4)"
        backLabel="Back"
        onBack={backToOverview}
        primaryLabel="Next: Campaign"
        onPrimary={nextToCampaign}
        secondaryLabel="Skip tour"
        onSecondary={skipTour}
      >
        <p>Keep your name, role, bio, education, and links accurate.</p>
        <p>Voters will get to know you better when you share your story!</p>
        <p>
          Tip: Candidates with complete profiles receive much more traction!
        </p>
      </TourModal>
      <div className="flex flex-col md:flex-row gap-6 min-w-0">
        <div className="flex flex-col space-y-4 w-full md:w-[40%]">
          <PhotoUploader
            clerkUserId={userId!}
            currentPhotoUrl={candidateData?.photoUrl || null}
            onUpload={() => refresh()}
          />
          {/* Education moved under photo uploader */}
          <div className="mt-2 ">
            <h2 className="text-lg font-semibold mb-2">Education</h2>

            <EducationList
              history={candidateData.history ?? []}
              onChanged={refresh}
            />
            <div className="mt-4 flex flex-row gap-2">
              <EducationAdder onSaved={() => refresh()} />
            </div>
          </div>
        </div>

        <div className="flex-1 mt-4 md:mt-0 min-w-0">
          {/* Full width on mobile with internal padding; desktop inherits natural width */}
          <div className="w-full mx-auto md:mx-0 px-4 sm:px-0 min-w-0">
            <BasicProfileForm />
            {/* Education moved to left column under photo uploader */}
          </div>
        </div>
      </div>
    </div>
  );
}

function EducationList({
  history,
  onChanged,
}: {
  history: string[];
  onChanged?: () => void;
}) {
  const items = extractEducation(history);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const current = editIdx !== null ? items[editIdx] : null;
  const [degree, setDegree] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [activities, setActivities] = useState("");
  const [city, setCity] = useState("");
  const [stateStr, setStateStr] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(i: number) {
    setEditIdx(i);
    const item = items[i];
    setDegree(item.degree ?? "");
    setGraduationYear(item.graduationYear ?? "");
    setActivities(item.activities ?? "");
    setCity(item.city ?? "");
    setStateStr(item.state ?? "");
  }

  async function saveEdit() {
    if (editIdx === null || !current) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/candidate/education`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index: editIdx,
          name: current.name,
          country: current.country,
          stateProvince: current.stateProvince ?? null,
          city: city || null,
          state: stateStr || null,
          website: current.website || null,
          degree: degree || null,
          graduationYear: graduationYear || null,
          activities: activities || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditIdx(null);
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  if (items.length === 0) {
    return (
      <div className="mt-4 p-4 border rounded-md">
        <p className="text-sm text-muted-foreground">
          You haven’t added any education yet. Add schools you’ve attended to
          help voters learn more about your background.
        </p>
      </div>
    );
  }
  return (
    <>
      <ul className="mt-4 divide-y rounded-md border">
        {items.map((e, idx) => {
          const homepage = e.website ?? "";
          let host = "";
          try {
            host = homepage ? new URL(homepage).hostname : "";
          } catch {
            host = "";
          }
          const ddg = host
            ? `https://icons.duckduckgo.com/ip3/${host}.ico`
            : "/default-image-college.png";
          const clearbit = host
            ? `https://logo.clearbit.com/${host}`
            : "/default-image-college.png";

          return (
            <li key={idx} className="p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5">
                    <ImageWithFallback
                      src={clearbit}
                      alt={`${e.name} logo`}
                      width={40}
                      height={40}
                      className="rounded bg-white"
                      fallbackSrc={[ddg, "/default-image-college.png"]}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.city || e.state
                        ? `${e.city ? `${e.city}, ` : ""}${e.state ?? ""}`
                        : e.stateProvince || e.country}
                    </div>
                    {e.degree ? (
                      <div className="text-sm mt-1">
                        <span className="text-gray-500 font-medium">
                          Degree:
                        </span>{" "}
                        <span className="text-gray-800">{e.degree}</span>
                        {e.graduationYear ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {e.graduationYear}
                          </span>
                        ) : null}
                      </div>
                    ) : e.graduationYear ? (
                      <div className="text-sm mt-1">
                        <span className="text-gray-500 font-medium">
                          Graduation:
                        </span>{" "}
                        <span className="text-gray-800">
                          {e.graduationYear}
                        </span>
                      </div>
                    ) : null}
                    {e.activities && (
                      <div className="text-sm mt-1 line-clamp-2">
                        <span className="text-gray-500 font-medium">
                          Activities and societies:
                        </span>{" "}
                        <span className="text-gray-700">{e.activities}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openEdit(idx)}
                  >
                    Edit
                  </button>
                  {/* Delete */}
                  <button
                    className="text-red-600 hover:underline"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/candidate/education?index=${idx}`,
                          { method: "DELETE" }
                        );
                        if (!res.ok) throw new Error("Failed to delete");
                        onChanged?.();
                      } catch (err) {
                        console.error(err);
                        alert("Could not delete this entry. Please try again.");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <Dialog
        key="edit-dialog"
        open={editIdx !== null}
        onOpenChange={(o) => !o && setEditIdx(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit education</DialogTitle>
            <DialogDescription>
              Update details for this school.
            </DialogDescription>
          </DialogHeader>
          {current && (
            <div className="space-y-4">
              <div>
                <div className="font-medium">{current.name}</div>
                <div className="text-sm text-muted-foreground">
                  {current.stateProvince ? `${current.stateProvince}, ` : ""}
                  {current.country}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="degree-edit">Degree</Label>
                  <Input
                    id="degree-edit"
                    value={degree}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDegree(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gradYear-edit">Graduation Year</Label>
                  <Input
                    id="gradYear-edit"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={graduationYear}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setGraduationYear(e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city-edit">City</Label>
                  <Input
                    id="city-edit"
                    value={city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCity(e.target.value)
                    }
                    placeholder="eg. Ithaca"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state-edit">State/Region</Label>
                  <Input
                    id="state-edit"
                    value={stateStr}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStateStr(e.target.value)
                    }
                    placeholder="eg. New York"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activities-edit">
                  Clubs, activities, honors
                </Label>
                <Textarea
                  id="activities-edit"
                  value={activities}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setActivities(e.target.value)
                  }
                  rows={3}
                />
              </div>
              {/* Website is inferred from the selected school and not editable here */}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditIdx(null)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
