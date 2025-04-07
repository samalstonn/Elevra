"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  FaSave,
  FaCheckCircle,
  FaCalendarAlt,
  FaCity,
  FaFlag,
} from "react-icons/fa";

interface ElectionSubmissionFormProps {
  userId?: string | null;
}

// Define election types that match your Prisma schema
type ElectionType = "LOCAL" | "STATE" | "NATIONAL" | "UNIVERSITY";

// Main form state interface
interface FormState {
  position: string;
  date: string;
  city: string;
  state: string;
  description: string;
  positions: string; // We'll parse this to a number on submission
  type: ElectionType;
}

// Initial empty form state
const initialFormState: FormState = {
  position: "",
  date: "",
  city: "",
  state: "",
  description: "",
  positions: "1",
  type: "LOCAL",
};

// Form validation error interface
interface FormErrors {
  position?: string;
  date?: string;
  city?: string;
  state?: string;
  description?: string;
  positions?: string;
}

export default function ElectionSubmissionForm({
  userId,
}: ElectionSubmissionFormProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("electionSubmissionDraft");
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
      } catch (e) {
        console.error("Error parsing saved draft:", e);
      }
    }
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

  // Save draft to localStorage
  const saveDraft = () => {
    localStorage.setItem("electionSubmissionDraft", JSON.stringify(formData));
    setDraftSaved(true);
    // Reset draft saved notification after 3 seconds
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Clear draft from localStorage and reset form
  const clearDraft = () => {
    localStorage.removeItem("electionSubmissionDraft");
    setFormData(initialFormState);
  };

  // Form validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    } else if (formData.position.length > 200) {
      newErrors.position = "Position must be less than 200 characters";
    }
    if (!formData.date) {
      newErrors.date = "Election date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      if (selectedDate < today) {
        newErrors.date = "Election date must be in the future";
      }
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
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }
    const positions = parseInt(formData.positions);
    if (isNaN(positions) || positions < 1) {
      newErrors.positions = "Number of positions must be at least 1";
    } else if (positions > 100) {
      newErrors.positions = "Number of positions must be less than 100";
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate the form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit/election", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          positions: parseInt(formData.positions),
          clerkUserId: userId || null,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        clearDraft(); // Clear draft after successful submission
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to submit election information");
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Position */}
      <div className="space-y-2">
        <label
          htmlFor="position"
          className="block text-sm font-medium text-gray-700"
        >
          Election Position/Title*
        </label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          placeholder="e.g., Mayor, City Council, School Board"
          className={errors.position ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.position && (
          <p className="text-red-500 text-xs mt-1">{errors.position}</p>
        )}
      </div>

      {/* Election Type */}
      <div className="space-y-2">
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700"
        >
          Election Type*
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="LOCAL">Local</option>
          <option value="STATE">State</option>
          <option value="NATIONAL">National</option>
          <option value="UNIVERSITY">University</option>
        </select>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <FaCalendarAlt className="text-purple-600" /> Election Date*
        </label>
        <Input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleInputChange}
          className={`bg-white ${errors.date ? "border-red-500" : ""}`}
        />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <FaCity className="text-purple-600" /> City*
          </label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Enter city"
            className={errors.city ? "border-red-500" : ""}
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <FaFlag className="text-purple-600" /> State*
          </label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="Enter state"
            className={errors.state ? "border-red-500" : ""}
          />
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-2">
        <label
          htmlFor="positions"
          className="block text-sm font-medium text-gray-700"
        >
          Number of Seats*
        </label>
        <Input
          id="positions"
          name="positions"
          type="number"
          min="1"
          value={formData.positions}
          onChange={handleInputChange}
          placeholder="Enter number of seats"
          className={errors.positions ? "border-red-500" : ""}
          style={{ width: "100%" }}
        />
        {errors.positions && (
          <p className="text-red-500 text-xs mt-1">{errors.positions}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Election Description*
        </label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide details about this election..."
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.description.length}/2000 characters
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
            Election information submitted successfully! Thank you for your
            contribution.
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
            "Submit Election"
          )}
        </Button>
      </div>
    </form>
  );
}
