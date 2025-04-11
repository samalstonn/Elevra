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
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaBriefcase,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import { AutocompleteSuggestion } from "@/types/geocoding";
import { Loader2 } from "lucide-react";

// Define service category enum to match Prisma schema
enum ServiceCategoryType {
  CREATIVE_BRANDING = "CREATIVE_BRANDING",
  DIGITAL_TECH = "DIGITAL_TECH",
  PHYSICAL_MEDIA = "PHYSICAL_MEDIA",
  CONSULTING_PR = "CONSULTING_PR",
  OTHER = "OTHER",
}

// Service category display names
const serviceCategoryLabels = {
  [ServiceCategoryType.CREATIVE_BRANDING]: "Creative & Branding",
  [ServiceCategoryType.DIGITAL_TECH]: "Digital & Technology",
  [ServiceCategoryType.PHYSICAL_MEDIA]: "Physical Media & Production",
  [ServiceCategoryType.CONSULTING_PR]: "Consulting & PR",
  [ServiceCategoryType.OTHER]: "Other Services",
};

// Define the form state interface
interface FormState {
  name: string;
  email: string;
  phone: string;
  bio: string;
  website: string;
  city: string;
  state: string;
  serviceCategory: ServiceCategoryType;
  serviceDescription: string;
}

// Form validation error interface
interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  city?: string;
  state?: string;
  website?: string;
  serviceCategory?: string;
  serviceDescription?: string;
}

// Initial empty form state
const initialFormState: FormState = {
  name: "",
  email: "",
  phone: "",
  bio: "",
  website: "",
  city: "",
  state: "",
  serviceCategory: ServiceCategoryType.OTHER,
  serviceDescription: "",
};

export default function VendorSignupForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

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
    const savedDraft = localStorage.getItem("vendorSignupDraft");
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

    // Pre-fill email from Clerk if available
    if (user && user.emailAddresses && user.emailAddresses.length > 0) {
      const primaryEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress;
      if (primaryEmail) {
        setFormData((prev) => ({
          ...prev,
          email: primaryEmail,
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

  // Save draft to localStorage
  const saveDraft = () => {
    localStorage.setItem("vendorSignupDraft", JSON.stringify(formData));
    setDraftSaved(true);
    // Reset draft saved notification after 3 seconds
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Clear draft from localStorage and reset form
  const clearDraft = () => {
    localStorage.removeItem("vendorSignupDraft");
    setFormData(initialFormState);
    setLocationInput("");
  };

  // Form validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Business name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^[0-9\-\(\)\s\+]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Business bio is required";
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

    return newErrors;
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isLoaded || !userId) {
      setErrorMessage("You must be logged in to register as a vendor.");
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
      const response = await fetch("/api/vendor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          clerkUserId: userId,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        clearDraft(); // Clear draft after successful submission

        // Redirect to vendor dashboard after successful submission
        setTimeout(() => {
          router.push("/vendors/vendor-dashboard");
        }, 2000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to submit vendor information");
        setSubmitStatus("error");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error creating candidate:", error);
      }
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
        <p className="mb-4">Please sign in before registering as a vendor.</p>
        <Button
          variant="purple"
          onClick={() =>
            router.push(
              `/sign-in?redirect_url=${encodeURIComponent(
                window.location.pathname
              )}`
            )
          }
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Business Name*
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Your business or service name"
          className={errors.name ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <FaEnvelope className="text-purple-600" /> Email*
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="contact@example.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <FaPhone className="text-purple-600" /> Phone (Optional)
          </label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(123) 456-7890"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label
          htmlFor="website"
          className="block text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <FaGlobe className="text-purple-600" /> Website (Optional)
        </label>
        <Input
          id="website"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          placeholder="https://yourbusiness.com"
          className={errors.website ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.website && (
          <p className="text-red-500 text-xs mt-1">{errors.website}</p>
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

      {/* Business Bio */}
      <div className="space-y-2">
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700 text-left"
        >
          Business Description*
        </label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Describe your business, experience, and what sets you apart..."
          className={errors.bio ? "border-red-500" : ""}
        />
        {errors.bio && (
          <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.bio.length}/2000 characters
        </p>
      </div>

      {/* Service Category */}
      <div className="space-y-2">
        <label
          htmlFor="serviceCategory"
          className="block text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <FaBriefcase className="text-purple-600" /> Service Category*
        </label>
        <select
          id="serviceCategory"
          name="serviceCategory"
          value={formData.serviceCategory}
          onChange={handleInputChange}
          className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
        >
          {Object.entries(serviceCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Service Description */}
      <div className="space-y-2">
        <label
          htmlFor="serviceDescription"
          className="block text-sm font-medium text-gray-700 text-left"
        >
          Additional Notes
        </label>
        <Textarea
          id="serviceDescription"
          name="serviceDescription"
          rows={3}
          value={formData.serviceDescription}
          onChange={handleInputChange}
          placeholder="Explain your services, expertise, and how you can help political campaigns..."
          className={errors.serviceDescription ? "border-red-500" : ""}
        />
        {errors.serviceDescription && (
          <p className="text-red-500 text-xs mt-1">
            {errors.serviceDescription}
          </p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.serviceDescription.length}/1000 characters
        </p>
      </div>

      {/* Display Success/Error Messages */}
      {submitStatus === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"
        >
          <FaCheckCircle />
          <span>
            Registration submitted successfully! Redirecting to dashboard...
          </span>
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
            "Register as a Vendor"
          )}
        </Button>
      </div>
    </form>
  );
}
