"use client";

import { useState } from "react";
import UniversitySearch from "@/components/UniversitySearch";
import type { University } from "@/lib/universities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function EducationAdder({
  onSaved,
}: {
  onSaved?: (history: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<University | null>(null);
  const [degree, setDegree] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [activities, setActivities] = useState("");
  // City and state are now auto-populated from the selected university
  const [city, setCity] = useState("");
  const [stateStr, setStateStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!selected || saving) return;
    setSaving(true);
    setMessage(null);
    const website = selected.web_pages?.[0] ?? null;
    const stateProvince = (selected as any)["state-province"] ?? null;
    try {
      const res = await fetch("/api/candidate/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          country: selected.country,
          stateProvince,
          city: city || null,
          state: stateStr || stateProvince || null,
          website,
          degree: degree || null,
          graduationYear: graduationYear || null,
          activities: activities || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      onSaved?.(data.history ?? []);
      // reset
      setSelected(null);
      setDegree("");
      setGraduationYear("");
      setActivities("");
      setCity("");
      setStateStr("");
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setMessage(msg);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="whitePrimaryOutline"
            className="w-full sm:w-auto"
          >
            Add education
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add education</DialogTitle>
            <DialogDescription>
              Search for your school, then add details.
            </DialogDescription>
          </DialogHeader>
          {!selected ? (
            <div className="mt-2">
              <UniversitySearch
                onSelect={(u) => {
                  setSelected(u);
                  // Automatically populate city and state from the API
                  const stateVal = u.state ?? u["state-province"] ?? "";
                  const cityVal = u.city ?? "";
                  setStateStr(stateVal);
                  setCity(cityVal);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 border rounded-md">
                <div className="font-medium">{selected.name}</div>
                {(city || stateStr) && (
                  <div className="text-sm text-muted-foreground">
                    {[city, stateStr].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    value={degree}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDegree(e.target.value)
                    }
                    placeholder="e.g., B.S. Computer Science"
                    className="w-[90%]"
                  />
                </div>
                <div className="space-y-1.5 ">
                  <Label htmlFor="gradYear">Graduation Year</Label>
                  <Input
                    id="gradYear"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={graduationYear}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setGraduationYear(e.target.value)
                    }
                    placeholder="e.g., 2024"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCity(e.target.value)
                    }
                    placeholder="e.g., Cambridge"
                    className="w-[90%]"
                  />
                </div>
                <div className="space-y-1.5 ">
                  <Label htmlFor="state">State/Region</Label>
                  <Input
                    id="state"
                    value={stateStr}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStateStr(e.target.value)
                    }
                    placeholder="e.g., MA"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activities">Clubs, activities, honors</Label>
                <Textarea
                  id="activities"
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="e.g., Debate Team, Honors Program, Student Government"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(null)}
                >
                  Back
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
