"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCandidate } from "@/lib/useCandidate";

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
  currentCity?: string;
  currentState?: string;
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

  const { data: candidate } = useCandidate();

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

  // Validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.currentRole.trim()) newErrors.currentRole = "Required";
    if (!formData.currentCity.trim())
      newErrors.currentCity = "City is required";
    if (!formData.currentState.trim())
      newErrors.currentState = "State is required";
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
    } catch {
      setErrorMessage("Update error");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full text-left min-w-0"
    >
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
          className={`w-full max-w-full ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>
      <div className="space-y-2">
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
          className={`w-full max-w-full ${
            errors.currentRole ? "border-red-500" : ""
          }`}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="currentCity"
            className="block text-sm font-medium text-gray-700"
          >
            City*
          </label>
          <Input
            id="currentCity"
            name="currentCity"
            value={formData.currentCity}
            onChange={handleInputChange}
            className={`w-full max-w-full ${
              errors.currentCity ? "border-red-500" : ""
            }`}
          />
          {errors.currentCity && (
            <p className="text-red-500 text-xs mt-1">{errors.currentCity}</p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="currentState"
            className="block text-sm font-medium text-gray-700"
          >
            State*
          </label>
          <Input
            id="currentState"
            name="currentState"
            value={formData.currentState}
            onChange={handleInputChange}
            className={`w-full max-w-full ${
              errors.currentState ? "border-red-500" : ""
            }`}
          />
          {errors.currentState && (
            <p className="text-red-500 text-xs mt-1">{errors.currentState}</p>
          )}
        </div>
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
          className={`w-full max-w-full ${errors.bio ? "border-red-500" : ""}`}
          rows={5}
        />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            Website
          </label>
          <Input
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="Website"
            className="w-full max-w-full"
          />
        </div>
        <div>
          <label
            htmlFor="linkedin"
            className="block text-sm font-medium text-gray-700"
          >
            LinkedIn
          </label>
          <Input
            id="linkedin"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleInputChange}
            placeholder="LinkedIn"
            className="w-full max-w-full"
          />
        </div>
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
      <div className="flex flex-row gap-2">
        <Button type="submit" disabled={isSubmitting} className="md:w-auto">
          {isSubmitting ? "Updating..." : "Update Profile"}
        </Button>
        <Button
          type="button"
          variant="purple"
          className=" md:w-auto"
          onClick={() => {
            if (userId) {
              window.location.href = `/candidate/${candidate?.slug}`;
            }
          }}
        >
          View Public Profile
        </Button>
      </div>
    </form>
  );
}
