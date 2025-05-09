"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="grid grid-cols-2 gap-4">
        <div>
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
            className={errors.currentCity ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.currentCity && (
            <p className="text-red-500 text-xs mt-1">{errors.currentCity}</p>
          )}
        </div>
        <br />
        <div>
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
            className={errors.currentState ? "border-red-500" : ""}
            style={{ width: "100%" }}
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
          className={errors.bio ? "border-red-500" : ""}
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
            style={{ width: "100%" }}
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
            style={{ width: "100%" }}
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
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}
