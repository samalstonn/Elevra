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
import { Loader2 } from "lucide-react";

// Define Zod schema for validation
// Important: Make policies non-optional since the form expects it as a required field
const profileSchema = z.object({
  party: z.string().min(1, { message: "Party affiliation is required." }),
  votinglink: z
    .string()
    .url({ message: "Please enter a valid voting link URL." })
    .optional()
    .or(z.literal("")),
  policies: z
    .array(z.string())
    .max(5, { message: "Maximum 5 policies allowed." })
    .optional(),
  additionalNotes: z
    .string()
    .max(500, { message: "Notes cannot exceed 500 characters." })
    .optional(),
});

// The inferred type has policies as a required string[]
type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  candidateId: number;
  electionId: number;
  profileData: Partial<ProfileFormData>;
  onUpdateSuccess: () => void;
}

export function ProfileForm({
  candidateId,
  electionId,
  profileData,
  onUpdateSuccess,
}: ProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed: const [selectedElection, setSelectedElection] = useState<Election | null>(null);

  // Prepare the policies data - ensure it's a non-empty array
  const initialPolicies = Array.isArray(profileData.policies)
    ? profileData.policies.filter(Boolean)
    : [];

  // If no policies exist but schema requires at least one, provide a default
  const policiesWithDefault =
    initialPolicies.length > 0 ? initialPolicies : [""];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      party: profileData.party || "",
      votinglink: profileData.votinglink || "",
      policies: policiesWithDefault,
      additionalNotes: profileData.additionalNotes || "",
    },
  });

  // Reset form if profileData changes
  useEffect(() => {
    reset({
      party: profileData.party || "",
      votinglink: profileData.votinglink || "",
      policies:
        Array.isArray(profileData.policies) && profileData.policies.length > 0
          ? profileData.policies
          : [""],
      additionalNotes: profileData.additionalNotes || "",
    });
  }, [profileData, reset]);

  // Explicit type for onSubmit to match ProfileFormData exactly
  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      // Update only the election-specific candidate info via electionLink
      const updateRes = await fetch(
        `/api/electionlinks/${candidateId}/${electionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: {
              party: data.party,
              votinglink: data.votinglink ?? "",
              policies: (data.policies || []).filter((p) => p.trim() !== ""),
              additionalNotes: data.additionalNotes ?? "",
            },
          }),
        }
      );
      const updateResult = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateResult.error || "Failed to update profile.");
      }
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      onUpdateSuccess();
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
    <Card className="border-0 rounded-none shadow-none">
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
              <Label htmlFor="party">
                Affiliation (Political Party, College Major)
              </Label>
              <br />
              <Input id="party" {...register("party")} />
              {errors.party && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.party.message}
                </p>
              )}
            </div>
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
                  value={(field.value || []).join("\n")}
                  onChange={(e) => {
                    // Preserve all lines, including empty ones
                    const policies = e.target.value.split("\n");
                    field.onChange(policies);
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
          <div>
            <Label htmlFor="votinglink">Voting Link (Optional)</Label>
            <br />
            <Input
              id="votinglink"
              type="url"
              {...register("votinglink")}
              placeholder="https://..."
              style={{ width: "100%" }}
            />
            {errors.votinglink && (
              <p className="text-xs text-red-600 mt-1">
                {errors.votinglink.message}
              </p>
            )}
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

          {/* Submit and Public Profile Button */}
          <div className="flex justify-end gap-3 items-center">
            {/* Remove the public profile button for now, or if you still want it, you need to pass slug in profileData */}
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
