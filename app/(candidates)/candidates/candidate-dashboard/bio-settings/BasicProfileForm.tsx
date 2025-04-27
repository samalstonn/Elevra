"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FaMapMarkerAlt, FaGlobe, FaLinkedin } from "react-icons/fa";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { AutocompleteSuggestion } from "@/types/geocoding";
import { debounce } from "@/lib/debounce";
import { Link } from "lucide-react";

interface FormState {
  name: string;
  currentRole: string;
  currentCity: string;
  currentState: string;
  bio: string;
  website: string;
  linkedin: string;
}

const initialFormState: FormState = {
  name: "",
  currentRole: "",
  currentCity: "",
  currentState: "",
  bio: "",
  website: "",
  linkedin: "",
};

interface FormErrors {
  name?: string;
  currentRole?: string;
  location?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
}

export default function BasicProfileForm() {
  const { isLoaded, userId } = useAuth();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    AutocompleteSuggestion[]
  >([]);
  const [_isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch existing candidate data
  useEffect(() => {
    if (!isLoaded || !userId) return;
    fetch(`/api/candidate?clerkUserId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          currentRole: data.currentRole ?? "",
          currentCity: data.currentCity ?? "",
          currentState: data.currentState ?? "",
          bio: data.bio ?? "",
          website: data.website ?? "",
          linkedin: data.linkedin ?? "",
        }));
        setLocationInput(`${data.currentCity}, ${data.currentState}`);
      })
      .catch((e) => console.error(e));
  }, [isLoaded, userId]);

  // Input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitStatus(null);
  };

  // Location handlers (same as signup)
  const debouncedFetch = debounce(async (input: string) => {
    if (input.trim().length < 2) {
      setLocationSuggestions([]);
      setIsLoadingLocations(false);
      return;
    }
    try {
      const results = await getLocationSuggestions(input);
      setLocationSuggestions(results);
    } catch {
      setLocationSuggestions([]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, 300);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationInput(val);
    setErrors((prev) => ({ ...prev, location: undefined }));
    if (val.trim().length >= 2) {
      setIsLoadingLocations(true);
      setShowLocationSuggestions(true);
      debouncedFetch(val);
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const handleLocationSelect = async (s: AutocompleteSuggestion) => {
    setLocationInput(s.placeName);
    setShowLocationSuggestions(false);
    if (s.city && s.state) {
      setFormData((prev) => ({
        ...prev,
        currentCity: s.city ?? "",
        currentState: s.state ?? "",
      }));
    } else {
      try {
        const normalized = await normalizeLocation(s.placeName);
        if ("city" in normalized && "state" in normalized) {
          setFormData((prev) => ({
            ...prev,
            currentCity: normalized.city ?? "",
            currentState: normalized.state ?? "",
          }));
        }
      } catch {
        setErrors((prev) => ({
          ...prev,
          location: "Could not resolve location",
        }));
      }
    }
  };

  const handleLocationBlur = () => {
    setTimeout(() => setShowLocationSuggestions(false), 200);
  };

  // Validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.currentRole.trim()) newErrors.currentRole = "Required";
    if (!formData.currentCity || !formData.currentState)
      newErrors.location = "Required";
    if (!formData.bio.trim()) newErrors.bio = "Required";
    return newErrors;
  };

  // Submit update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newErrors = validateForm();
      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        return;
      }
      if (!isLoaded || !userId) {
        setErrorMessage("Not authorized");
        setSubmitStatus("error");
        return;
      }
      setSubmitStatus(null);
      const payload = {
        name: formData.name.trim(),
        currentRole: formData.currentRole,
        city: formData.currentCity,
        state: formData.currentState,
        bio: formData.bio,
        website: formData.website,
        linkedin: formData.linkedin,
      };
      const res = await fetch("/api/candidate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitStatus("success");
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Update failed");
        setSubmitStatus("error");
      }
    } catch (err) {
      setErrorMessage("Update error");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      <div>
        <label
          htmlFor="currentRole"
          className="block text-sm font-medium text-gray-700"
        >
          Current Role*
        </label>
        <Input
          name="currentRole"
          value={formData.currentRole}
          onChange={handleInputChange}
          className={errors.currentRole ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
      </div>
      <div className="relative">
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <FaMapMarkerAlt className="text-purple-600" /> Location*
        </label>
        <Input
          ref={locationInputRef}
          name="location"
          value={locationInput}
          onChange={handleLocationChange}
          onBlur={handleLocationBlur}
          style={{ width: "100%" }}
        />
        {showLocationSuggestions && (
          <div ref={suggestionsRef} className="absolute z-10 bg-white border">
            {locationSuggestions.map((s, i) => (
              <div key={i} onClick={() => handleLocationSelect(s)}>
                {s.placeName}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Biography*
        </label>
        <Textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className={errors.bio ? "border-red-500" : ""}
        />
      </div>
      <div className="flex gap-4">
        <Input
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          placeholder="Website"
        />
        <Input
          name="linkedin"
          value={formData.linkedin}
          onChange={handleInputChange}
          placeholder="LinkedIn"
        />
      </div>
      {submitStatus === "success" && (
        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
          Profile updated successfully!
        </div>
      )}
      {submitStatus === "error" && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}
