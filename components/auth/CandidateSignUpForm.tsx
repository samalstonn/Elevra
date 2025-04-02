"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  FaSave,
  FaCheckCircle,
  FaPlus,
  FaTimes,
  FaGlobe,
  FaLinkedin,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import SearchBar from "@/components/ResultsSearchBar";
import { Election } from "@prisma/client";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import { AutocompleteSuggestion, NormalizedLocation } from "@/types/geocoding";
import { Loader2 } from "lucide-react";

// Form state interface
interface FormState {
  name: string;
  party: string;
  position: string;
  bio: string;
  website: string;
  linkedin: string;
  city: string;
  state: string;
  policies: string[];
  electionId: string;
  additionalNotes: string;
}

// Initial empty form state
const initialFormState: FormState = {
  name: "",
  party: "",
  position: "",
  bio: "",
  website: "",
  linkedin: "",
  city: "",
  state: "",
  policies: [],
  electionId: "",
  additionalNotes: "",
};

// Form validation error interface
interface FormErrors {
  name?: string;
  party?: string;
  position?: string;
  bio?: string;
  city?: string;
  state?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  policies?: string;
  electionId?: string;
}

export default function CandidateSignupForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [newPolicy, setNewPolicy] = useState("");
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

  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("candidateSignupDraft");
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        if (parsedDraft.city && parsedDraft.state) {
          setLocationInput(`${parsedDraft.city}, ${parsedDraft.state}`);
        }
      } catch (e) {
        console.error("Error parsing saved draft:", e);
      }
    }

    // Pre-fill email and name from Clerk if available
    if (user) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      if (fullName) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || fullName,
        }));
      }
    }
  }, [user]);

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

  // Fetch election details when electionId changes
  useEffect(() => {
    if (formData.electionId) {
      fetch(`/api/elections/${formData.electionId}`)
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
    } else {
      setSelectedElection(null);
    }
  }, [formData.electionId]);

  // Input change handler
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user makes changes
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Reset success/error message when form is being edited
    setSubmitStatus(null);
  };

  // Location input change handler with debounced suggestions
  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationInput(value);

    // Clear location-related errors
    if (errors.city || errors.state || errors.location) {
      setErrors((prev) => ({
        ...prev,
        city: undefined,
        state: undefined,
        location: undefined,
      }));
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
      setFormData((prev) => ({
        ...prev,
        city: suggestion.city || "",
        state: suggestion.state || "",
      }));
    } else {
      // Try to normalize the location if city/state not provided in suggestion
      try {
        const normalizedLocation = await normalizeLocation(
          suggestion.placeName
        );
        if ("city" in normalizedLocation && "state" in normalizedLocation) {
          setFormData((prev) => ({
            ...prev,
            city: normalizedLocation.city || "",
            state: normalizedLocation.state || "",
          }));
        }
      } catch (error) {
        console.error("Error normalizing location:", error);
        setErrors((prev) => ({
          ...prev,
          location: "Unable to determine city and state from this location",
        }));
      }
    }
  };

  // Handle manual location validation when input field loses focus
  const handleLocationBlur = async () => {
    if (locationInput && !formData.city && !formData.state) {
      try {
        const normalizedLocation = await normalizeLocation(locationInput);
        if ("city" in normalizedLocation && "state" in normalizedLocation) {
          setFormData((prev) => ({
            ...prev,
            city: normalizedLocation.city || "",
            state: normalizedLocation.state || "",
          }));
          setLocationInput(normalizedLocation.fullAddress || "");
        } else if ("message" in normalizedLocation) {
          setErrors((prev) => ({
            ...prev,
            location: normalizedLocation.message,
          }));
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

  // Add policy to the list
  const addPolicy = () => {
    if (newPolicy.trim() === "") return;
    // Check if we already have 5 policies
    if (formData.policies.length >= 5) {
      setErrors((prev) => ({
        ...prev,
        policies: "Maximum of 5 policies allowed",
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      policies: [...prev.policies, newPolicy.trim()],
    }));
    setNewPolicy("");
    // Clear policy error if it exists
    if (errors.policies) {
      setErrors((prev) => ({ ...prev, policies: undefined }));
    }
  };

  // Remove policy from the list
  const removePolicy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      policies: prev.policies.filter((_, i) => i !== index),
    }));
    // Clear policy error if it exists
    if (errors.policies) {
      setErrors((prev) => ({ ...prev, policies: undefined }));
    }
  };

  // Save draft to localStorage
  const saveDraft = () => {
    localStorage.setItem("candidateSignupDraft", JSON.stringify(formData));
    setDraftSaved(true);
    // Reset draft saved notification after 3 seconds
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Clear draft from localStorage and reset form
  const clearDraft = () => {
    localStorage.removeItem("candidateSignupDraft");
    setFormData(initialFormState);
    setLocationInput("");
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Form validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.party.trim()) {
      newErrors.party = "Party is required";
    } else if (formData.party.length > 100) {
      newErrors.party = "Party must be less than 100 characters";
    }

    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    } else if (formData.position.length > 200) {
      newErrors.position = "Position must be less than 200 characters";
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length > 2000) {
      newErrors.bio = "Bio must be less than 2000 characters";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    } else if (formData.city.length > 100) {
      newErrors.city = "City must be less than 100 characters";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    } else if (formData.state.length > 50) {
      newErrors.state = "State must be less than 50 characters";
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid URL";
    }

    if (formData.linkedin && !isValidUrl(formData.linkedin)) {
      newErrors.linkedin = "Please enter a valid URL";
    }

    if (formData.policies.length === 0) {
      newErrors.policies = "At least one policy is required";
    }

    // Election can be optional as specified

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isLoaded || !userId) {
      setErrorMessage("You must be logged in to register as a candidate.");
      setSubmitStatus("error");
      return;
    }

    // Validate the form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          electionId: formData.electionId
            ? parseInt(formData.electionId)
            : undefined,
          clerkUserId: userId,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        clearDraft(); // Clear draft after successful submission

        // Redirect to candidate dashboard after successful submission
        setTimeout(() => {
          router.push("/candidates/candidate-dashboard");
        }, 2000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to submit candidate information");
        setSubmitStatus("error");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading authentication...</div>;
  }

  if (!userId) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="mb-4">
          Please sign in before registering as a candidate.
        </p>
        <Button
          variant="purple"
          onClick={() => router.push("/sign-in?redirect=/candidates")}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Candidate Name */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Full Name*
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Your full name"
          className={errors.name ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Party Affiliation */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="party"
          className="block text-sm font-medium text-gray-700"
        >
          Political Party/Affiliation*
        </label>
        <Input
          id="party"
          name="party"
          value={formData.party}
          onChange={handleInputChange}
          placeholder="e.g., Democrat, Republican, Independent"
          className={errors.party ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.party && (
          <p className="text-red-500 text-xs mt-1">{errors.party}</p>
        )}
      </div>

      {/* Position */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="position"
          className="block text-sm font-medium text-gray-700"
        >
          Position*
        </label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          placeholder="e.g., Mayor, City Council, State Representative"
          className={errors.position ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.position && (
          <p className="text-red-500 text-xs mt-1">{errors.position}</p>
        )}
      </div>

      {/* Location with Autocomplete */}
      <div className="space-y-2 relative">
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <FaMapMarkerAlt className="text-purple-600" /> Location*
        </label>
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
            className={errors.location ? "border-red-500" : ""}
            autoComplete="off"
            style={{ width: "100%" }}
          />
          {isLoadingLocations && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        {errors.location && (
          <p className="text-red-500 text-xs mt-1">{errors.location}</p>
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
        {formData.city && formData.state && (
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <FaCheckCircle className="text-green-500 mr-2" />
            <span>
              Selected: {formData.city}, {formData.state}
            </span>
          </div>
        )}
      </div>

      {/* Hidden City and State fields (populated by location selection) */}
      <input type="hidden" name="city" value={formData.city} />
      <input type="hidden" name="state" value={formData.state} />

      {/* Display city/state errors */}
      {(errors.city || errors.state) && (
        <div className="text-red-500 text-xs mt-1">
          {errors.city || errors.state}
        </div>
      )}

      {/* Election Search */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="electionId"
          className="block text-sm font-medium text-gray-700"
        >
          Election (Optional)
        </label>
        <p className="text-sm text-gray-500">
          If you're not currently running in an election, leave this blank. You
          can add an election later from your dashboard.
        </p>

        {/* Display the selected election */}
        {formData.electionId && selectedElection && (
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
              onClick={() =>
                setFormData((prev) => ({ ...prev, electionId: "" }))
              }
              className="text-gray-400 hover:text-gray-600"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Show search if no election is selected */}
        {!formData.electionId && (
          <SearchBar
            placeholder="Search for an election..."
            apiEndpoint="/api/elections/search"
            shadow={false}
            onResultSelect={(election) => {
              setFormData((prev) => ({
                ...prev,
                electionId: election.id.toString(),
              }));
            }}
          />
        )}
      </div>

      {/* Bio */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700"
        >
          Biography*
        </label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Provide information about your background, experience, and qualifications..."
          className={errors.bio ? "border-red-500" : ""}
        />
        {errors.bio && (
          <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.bio.length}/2000 characters
        </p>
      </div>

      {/* Policies */}
      <div className="space-y-2 text-left">
        <label className="block text-sm font-medium text-gray-700">
          Policies* ({formData.policies.length}/5)
        </label>
        <div className="flex gap-2">
          <Input
            id="newPolicy"
            value={newPolicy}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewPolicy(e.target.value)
            }
            placeholder="Add a policy"
            className="flex-grow"
          />
          <Button
            type="button"
            onClick={addPolicy}
            disabled={formData.policies.length >= 5}
            variant="outline"
            className="whitespace-nowrap flex items-center gap-2"
          >
            <FaPlus />
            <span>Add</span>
          </Button>
        </div>

        {errors.policies && (
          <p className="text-red-500 text-xs mt-1">{errors.policies}</p>
        )}

        <ul className="mt-3 space-y-2">
          {formData.policies.map((policy, index) => (
            <li
              key={index}
              className="flex items-center bg-gray-50 p-2 rounded-md"
            >
              <span className="flex-grow">{policy}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePolicy(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTimes />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Website and LinkedIn */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 text-left">
          Optional Contact Information
        </h3>

        <div className="flex items-center gap-3">
          <FaGlobe className="text-purple-600 text-lg" />
          <div className="flex-grow space-y-1">
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className={`${errors.website ? "border-red-500" : ""} w-full`}
              style={{ width: "100%" }}
            />
            {errors.website && (
              <p className="text-red-500 text-xs">{errors.website}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FaLinkedin className="text-purple-600 text-lg" />
          <div className="flex-grow space-y-1 w-full">
            <Input
              id="linkedin"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/username"
              className={`${errors.linkedin ? "border-red-500" : ""} w-full`}
              style={{ width: "100%" }}
            />
            {errors.linkedin && (
              <p className="text-red-500 text-xs">{errors.linkedin}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="additionalNotes"
          className="block text-sm font-medium text-gray-700"
        >
          Additional Notes (Optional)
        </label>
        <Textarea
          id="additionalNotes"
          name="additionalNotes"
          rows={3}
          value={formData.additionalNotes}
          onChange={handleInputChange}
          placeholder="Any additional information..."
          className="w-full"
        />
      </div>

      {/* Display Success/Error Messages */}
      {submitStatus === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"
        >
          <FaCheckCircle />
          <span>Registration successful! Redirecting to your dashboard...</span>
        </motion.div>
      )}

      {submitStatus === "error" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-100 text-red-700 rounded-lg"
        >
          {errorMessage}
        </motion.div>
      )}

      {/* Display Draft Saved Message */}
      {draftSaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2"
        >
          <FaSave />
          <span>Draft saved successfully!</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between pt-4">
        <div className="space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            className="flex items-center gap-2"
          >
            <FaSave />
            <span>Save Draft</span>
          </Button>
        </div>

        <Button
          type="submit"
          variant="purple"
          disabled={isSubmitting}
          className="ml-auto"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            "Register as a Candidate"
          )}
        </Button>
      </div>
    </form>
  );
}
