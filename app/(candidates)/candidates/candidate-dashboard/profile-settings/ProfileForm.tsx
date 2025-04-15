"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
import { AutocompleteSuggestion } from "@/types/geocoding";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import SearchBar from "@/components/ResultsSearchBar";
import { Election } from "@prisma/client";

// Define Zod schema for validation
// Important: Make policies non-optional since the form expects it as a required field
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  party: z.string().min(1, { message: "Party affiliation is required." }),
  position: z.string().min(3, { message: "Position sought is required." }),
  bio: z
    .string()
    .min(10, { message: "Bio must be at least 10 characters." })
    .max(10000, { message: "Bio cannot exceed 10000 characters." }),
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
  votinglink: z
    .string()
    .url({ message: "Please enter a valid voting link URL." })
    .optional()
    .or(z.literal("")),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }), // Assuming 2-letter state code
  // Define as non-optional array - this is the key change (removed)
  policies: z
    .array(z.string().min(0, { message: "Policy cannot be empty" }))
    .max(5, { message: "Maximum 5 policies allowed." })
    .optional(),
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
  const [selectedElection, setSelectedElection] = useState<Election | null>(
    null
  );

  // Location search state
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    AutocompleteSuggestion[]
  >([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [locationErrors, setLocationErrors] = useState<{
    city?: string;
    state?: string;
    location?: string;
  }>({});

  // Prepare the policies data - ensure it's a non-empty array
  const initialPolicies = Array.isArray(candidateData.policies)
    ? candidateData.policies.filter(Boolean)
    : [];

  // If no policies exist but schema requires at least one, provide a default
  const policiesWithDefault =
    initialPolicies.length > 0 ? initialPolicies : [""];

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
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
      votinglink: candidateData.votinglink || "",
      city: candidateData.city || "",
      state: candidateData.state || "",
      // This is required by the ProfileFormData type
      policies: policiesWithDefault,
      additionalNotes: candidateData.additionalNotes || "",
      electionId: candidateData.electionId || null,
    },
  });

  // Initialize location input and fetch election when component mounts
  useEffect(() => {
    // Set location input if city and state are available
    if (candidateData.city && candidateData.state) {
      setLocationInput(`${candidateData.city}, ${candidateData.state}`);
    }

    // Fetch election details if electionId exists
    if (candidateData.electionId) {
      fetch(`/api/elections/${candidateData.electionId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Election not found");
          }
          return res.json();
        })
        .then((data) => setSelectedElection(data))
        .catch((err) => {
          console.error("Error fetching election details:", err);
          setSelectedElection(null);
        });
    }
  }, [candidateData]);

  // Reset form if candidateData changes
  useEffect(() => {
    reset({
      name: candidateData.name || "",
      party: candidateData.party || "",
      position: candidateData.position || "",
      bio: candidateData.bio || "",
      website: candidateData.website || "",
      linkedin: candidateData.linkedin || "",
      votinglink: candidateData.votinglink || "",
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Location input change handler with debounced suggestions
  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationInput(value);

    // Clear location-related errors
    if (
      locationErrors.city ||
      locationErrors.state ||
      locationErrors.location
    ) {
      setLocationErrors({});
    }

    if (value.trim().length >= 2) {
      setIsLoadingLocations(true);
      setShowLocationSuggestions(true);
      debouncedFetchLocationSuggestions(value);
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  // Debounced location suggestions fetch
  const debouncedFetchLocationSuggestions = debounce(async (input: string) => {
    if (input.trim().length < 2) {
      setLocationSuggestions([]);
      setIsLoadingLocations(false);
      return;
    }

    try {
      const results = await getLocationSuggestions(input);
      setLocationSuggestions(results);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  }, 500);

  // Handle location suggestion selection
  const handleSelectLocationSuggestion = async (
    suggestion: AutocompleteSuggestion
  ) => {
    setLocationInput(suggestion.placeName);
    setShowLocationSuggestions(false);

    if (suggestion.city && suggestion.state) {
      setValue("city", suggestion.city);
      setValue("state", suggestion.state);
    } else {
      // Try to normalize the location if city/state not provided in suggestion
      try {
        const normalizedLocation = await normalizeLocation(
          suggestion.placeName
        );
        if ("city" in normalizedLocation && "state" in normalizedLocation) {
          setValue("city", normalizedLocation.city || "");
          setValue("state", normalizedLocation.state || "");
          setLocationInput(normalizedLocation.fullAddress || "");
        }
      } catch (error) {
        console.error("Error normalizing location:", error);
        setLocationErrors({
          location: "Unable to determine city and state from this location",
        });
      }
    }
  };

  // Handle manual location validation when input field loses focus
  const handleLocationBlur = async () => {
    if (locationInput && (!getValues("city") || !getValues("state"))) {
      try {
        const normalizedLocation = await normalizeLocation(locationInput);
        if ("city" in normalizedLocation && "state" in normalizedLocation) {
          setValue("city", normalizedLocation.city || "");
          setValue("state", normalizedLocation.state || "");
          setLocationInput(normalizedLocation.fullAddress || "");
        } else if ("message" in normalizedLocation) {
          setLocationErrors({
            location: normalizedLocation.message,
          });
        }
      } catch (error) {
        console.error("Error validating location:", error);
      }
    }

    // Hide suggestions after a short delay (allows for clicks on suggestions)
    setTimeout(() => {
      setShowLocationSuggestions(false);
    }, 200);
  };

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
          policies: (data.policies || []).filter(
            (policy) => policy.trim() !== ""
          ),
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
              <Label htmlFor="name">Full Name</Label>
              <br />
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="party">Party Affiliation</Label>
              <br />
              <Input id="party" {...register("party")} />
              {errors.party && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.party.message}
                </p>
              )}
            </div>
          </div>

          {/* Position */}
          <div>
            <Label htmlFor="position">
              Current Position (Eg. Running for Mayor, Incumbent Mayor, Business
              Owner, etc.)
            </Label>
            <br />
            <Input
              id="position"
              {...register("position")}
              style={{ width: "100%" }}
            />
            {errors.position && (
              <p className="text-xs text-red-600 mt-1">
                {errors.position.message}
              </p>
            )}
          </div>

          {/* Location with Autocomplete */}
          <div className="space-y-2 relative">
            <Label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <FaMapMarkerAlt className="text-purple-600" /> Location
            </Label>
            <div className="relative">
              <Input
                ref={locationInputRef}
                id="location"
                name="location"
                value={locationInput}
                onChange={handleLocationInputChange}
                onBlur={handleLocationBlur}
                onFocus={() => {
                  if (locationInput.trim().length >= 2) {
                    setShowLocationSuggestions(true);
                  }
                }}
                placeholder="Enter city, state, or ZIP code"
                className={locationErrors.location ? "border-red-500" : ""}
                autoComplete="off"
                style={{ width: "100%" }}
              />
              {isLoadingLocations && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {locationErrors.location && (
              <p className="text-xs text-red-600 mt-1">
                {locationErrors.location}
              </p>
            )}

            {/* Location Suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
              >
                <ul className="py-1">
                  {locationSuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.id || index}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-center"
                      onClick={() => handleSelectLocationSuggestion(suggestion)}
                    >
                      <FaMapMarkerAlt className="text-purple-400 mr-2 flex-shrink-0" />
                      <span className="text-sm">{suggestion.placeName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Display selected location info */}
            {getValues("city") && getValues("state") && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span>
                  Selected: {getValues("city")}, {getValues("state")}
                </span>
              </div>
            )}
          </div>

          {/* Hidden City and State fields (populated by location selection) */}
          <input type="hidden" {...register("city")} />
          <input type="hidden" {...register("state")} />

          {/* Election Search */}
          <div className="space-y-2 text-left">
            <Label
              htmlFor="electionId"
              className="block text-sm font-medium text-gray-700"
            >
              Link to Election (Optional)
            </Label>
            <p className="text-sm text-gray-500">
              If you&rsquo;re not currently running in an election, leave this
              blank.
            </p>

            {/* Display the selected election */}
            {selectedElection && (
              <div className="flex items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded-xl shadow-sm">
                <div>
                  <div className="font-medium">{selectedElection.position}</div>
                  <div className="text-gray-600 text-sm">
                    {selectedElection.city}, {selectedElection.state}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedElection(null);
                    setValue("electionId", null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Show search if no election is selected */}
            {!selectedElection && (
              <SearchBar
                placeholder="Search for an election..."
                apiEndpoint="/api/elections/search"
                shadow={false}
                onResultSelect={(election) => {
                  fetch(`/api/elections/${election.id}`)
                    .then((res) => {
                      if (!res.ok) {
                        throw new Error("Election not found");
                      }
                      return res.json();
                    })
                    .then((electionData) => {
                      setSelectedElection(electionData);
                      setValue("electionId", electionData.id);
                    })
                    .catch((err) => {
                      console.error("Error fetching election details:", err);
                    });
                }}
              />
            )}
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
                  value={(field.value || []).join("\n")}
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
              <br />
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
              <br />
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
          <div>
            <Label htmlFor="votinglink">Voting Link (Optional)</Label>
            <br />
            <Input
              id="votinglink"
              type="url"
              {...register("votinglink")}
              placeholder="https://..."
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
            <Button variant="purple" asChild>
              <a
                href={`/candidate/${candidateData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Public Profile
              </a>
            </Button>
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
