"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CandidateDashboardData } from "@/types/candidate";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // For Election selection

// Define Zod schema for validation
// Important: Make policies non-optional since the form expects it as a required field
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  party: z.string().min(1, { message: "Party affiliation is required." }),
  position: z.string().min(3, { message: "Position sought is required." }),
  bio: z
    .string()
    .min(10, { message: "Bio must be at least 10 characters." })
    .max(1000, { message: "Bio cannot exceed 1000 characters." }),
  website: z
    .string()
    .url({ message: "Please enter a valid URL." })
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url({ message: "Please enter a valid LinkedIn URL." })
    .optional()
    .or(z.literal("")),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }), // Assuming 2-letter state code
  // Define as non-optional array - this is the key change
  policies: z
    .array(z.string().min(1, { message: "Policy cannot be empty" }))
    .max(5, { message: "Maximum 5 policies allowed." }),
  additionalNotes: z
    .string()
    .max(500, { message: "Notes cannot exceed 500 characters." })
    .optional(),
  electionId: z.number().int().positive().optional().nullable(), // Allow null or positive integer
});

// The inferred type has policies as a required string[]
type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  candidateData: CandidateDashboardData;
  onUpdateSuccess: (updatedData: CandidateDashboardData) => void;
}

export function ProfileForm({
  candidateData,
  onUpdateSuccess,
}: ProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableElections, setAvailableElections] = useState<
    { id: number; date: Date; position: string; city: string; state: string }[]
  >([]);

  // Prepare the policies data - ensure it's a non-empty array
  const initialPolicies = Array.isArray(candidateData.policies)
    ? candidateData.policies.filter(Boolean)
    : [];

  // If no policies exist but schema requires at least one, provide a default
  const policiesWithDefault =
    initialPolicies.length > 0 ? initialPolicies : [""];

  // Fetch available elections for the dropdown
  useEffect(() => {
    const fetchElections = async () => {
      try {
        // Fetch all elections - adjust API endpoint if needed
        const response = await fetch("/api/elections?city=all&state=all");
        if (!response.ok) throw new Error("Failed to fetch elections");
        const data = await response.json();
        setAvailableElections(data);
      } catch (error) {
        console.error("Error fetching elections:", error);
        toast({
          title: "Error",
          description: "Could not load available elections.",
          variant: "destructive",
        });
      }
    };
    fetchElections();
  }, [toast]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    // Default values must match the expected ProfileFormData type exactly
    defaultValues: {
      name: candidateData.name || "",
      party: candidateData.party || "",
      position: candidateData.position || "",
      bio: candidateData.bio || "",
      website: candidateData.website || "",
      linkedin: candidateData.linkedin || "",
      city: candidateData.city || "",
      state: candidateData.state || "",
      // This is required by the ProfileFormData type
      policies: policiesWithDefault,
      additionalNotes: candidateData.additionalNotes || "",
      electionId: candidateData.electionId || null,
    },
  });

  // Reset form if candidateData changes
  useEffect(() => {
    reset({
      name: candidateData.name || "",
      party: candidateData.party || "",
      position: candidateData.position || "",
      bio: candidateData.bio || "",
      website: candidateData.website || "",
      linkedin: candidateData.linkedin || "",
      city: candidateData.city || "",
      state: candidateData.state || "",
      // Always provide an array
      policies:
        Array.isArray(candidateData.policies) &&
        candidateData.policies.length > 0
          ? candidateData.policies
          : [""],
      additionalNotes: candidateData.additionalNotes || "",
      electionId: candidateData.electionId || null,
    });
  }, [candidateData, reset]);

  // Explicit type for onSubmit to match ProfileFormData exactly
  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/candidate/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidateData.id,
          ...data,
          // Ensure policies is an array of non-empty strings
          policies: data.policies.filter((policy) => policy.trim() !== ""),
          electionId: data.electionId ? Number(data.electionId) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile.");
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      onUpdateSuccess(result.candidate);
    } catch (error: unknown) {
      console.error("Update error:", error);
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile Information</CardTitle>
        <CardDescription>
          Update your public candidate profile details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="party">Party Affiliation</Label>
              <Input id="party" {...register("party")} />
              {errors.party && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.party.message}
                </p>
              )}
            </div>
          </div>

          {/* Position & Election */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Position Sought</Label>
              <Input id="position" {...register("position")} />
              {errors.position && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.position.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="electionId">Link to Election (Optional)</Label>
              <Controller
                control={control}
                name="electionId"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : "null"}
                    onValueChange={(value) =>
                      field.onChange(value === "null" ? null : parseInt(value))
                    }
                  >
                    <SelectTrigger id="electionId">
                      <SelectValue placeholder="Select an election..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>
                      {availableElections.map((election) => (
                        <SelectItem
                          key={election.id}
                          value={election.id.toString()}
                        >
                          {election.position} ({election.city}, {election.state}{" "}
                          - {new Date(election.date).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.electionId && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.electionId.message}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="state">State (Abbreviation)</Label>
              <Input id="state" {...register("state")} maxLength={2} />
              {errors.state && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biography</Label>
            <Textarea id="bio" {...register("bio")} rows={5} />
            {errors.bio && (
              <p className="text-xs text-red-600 mt-1">{errors.bio.message}</p>
            )}
          </div>

          {/* Policies */}
          <div>
            <Label htmlFor="policies">Key Policies (Max 5, one per line)</Label>
            <Controller
              control={control}
              name="policies"
              render={({ field }) => (
                <Textarea
                  id="policies"
                  rows={5}
                  value={field.value.join("\n")}
                  onChange={(e) => {
                    const valueText = e.target.value;
                    // Split by newlines and filter out empty lines
                    const policies = valueText
                      ? valueText
                          .split("\n")
                          .map((p) => p.trim())
                          .filter((p) => p !== "")
                      : [""]; // Default to array with empty string if no content

                    // If we end up with an empty array, use a default
                    field.onChange(policies.length > 0 ? policies : [""]);
                  }}
                />
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter each policy on a new line.
            </p>
            {errors.policies && (
              <p className="text-xs text-red-600 mt-1">
                {errors.policies.message}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website URL (Optional)</Label>
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://..."
              />
              {errors.website && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.website.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
              <Input
                id="linkedin"
                type="url"
                {...register("linkedin")}
                placeholder="https://linkedin.com/in/..."
              />
              {errors.linkedin && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.linkedin.message}
                </p>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              {...register("additionalNotes")}
              rows={3}
            />
            {errors.additionalNotes && (
              <p className="text-xs text-red-600 mt-1">
                {errors.additionalNotes.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
