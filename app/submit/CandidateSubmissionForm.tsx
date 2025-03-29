"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { FaSave, FaCheckCircle, FaPlus, FaTimes, FaGlobe, FaLinkedin, FaCity, FaFlag } from "react-icons/fa";
import SearchBar from "@/components/ResultsSearchBar";

// Type definition for Election data
type Election = {
  id: number;
  position: string;
  date: string;
  city: string;
  state: string;
};

interface CandidateSubmissionFormProps {
  userId?: string | null;
}

// Define the form state interface
interface FormState {
  name: string;
  party: string;
  position: string;
  bio: string;
  website: string;
  linkedin: string;
  city: string;
  state: string;
  additionalNotes: string;
  policies: string[];
  electionId: string;
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
  additionalNotes: "",
  policies: [],
  electionId: "",
};

// Form validation error interface
interface FormErrors {
  name?: string;
  party?: string;
  position?: string;
  bio?: string;
  city?: string;
  state?: string;
  website?: string;
  linkedin?: string;
  policies?: string;
  electionId?: string;
}


export default function CandidateSubmissionForm({ userId }: CandidateSubmissionFormProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [newPolicy, setNewPolicy] = useState("");
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("candidateSubmissionDraft");
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
      } catch (e) {
        console.error("Error parsing saved draft:", e);
      }
    }
  }, []);

  // Fetch election details when electionId changes
  useEffect(() => {
    if (formData.electionId && formData.electionId !== "new") {
      // This would be replaced with a real fetch
      // For demo purposes, simulate retrieving election details
      fetch(`/api/elections/${formData.electionId}`)
        .catch(() => {
          // Fallback mock data if endpoint doesn't exist yet
          return {
            json: () => Promise.resolve({
              id: parseInt(formData.electionId),
              position: "Election " + formData.electionId,
              date: "2025-11-05",
              city: "Sample City",
              state: "ST"
            })
          };
        })
        .then(res => res.json())
        .then(data => setSelectedElection(data))
        .catch(err => {
          console.error("Error fetching election details:", err);
          setSelectedElection(null);
        });
    } else {
      setSelectedElection(null);
    }
  }, [formData.electionId]);

  // Input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    localStorage.setItem("candidateSubmissionDraft", JSON.stringify(formData));
    setDraftSaved(true);
    // Reset draft saved notification after 3 seconds
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Clear draft from localStorage and reset form
  const clearDraft = () => {
    localStorage.removeItem("candidateSubmissionDraft");
    setFormData(initialFormState);
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
    
    if (!formData.electionId && formData.electionId !== "new") {
      newErrors.electionId = "Please select an election or 'Create New Election'";
    }
    
    return newErrors;
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
      const response = await fetch("/api/submit/candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          electionId: formData.electionId === "new" ? null : parseInt(formData.electionId),
          clerkUserId: userId || null,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        clearDraft(); // Clear draft after successful submission
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to submit candidate information");
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
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Candidate Full Name*
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Jane Smith"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Party */}
      <div className="space-y-2">
        <label htmlFor="party" className="block text-sm font-medium text-gray-700">
            Political Party/Affiliation*
        </label>
        <Input
            id="party"
            name="party"
            value={formData.party}
            onChange={handleInputChange}
            placeholder="e.g., Democrat, Republican, Independent"
            className={`${errors.party ? "border-red-500" : ""} w-full`}
            style={{ width: "100%" }}  // Ensure full width
        />
        {errors.party && (
            <p className="text-red-500 text-xs mt-1">{errors.party}</p>
        )}
      </div>

      {/* Position */}
      <div className="space-y-2">
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            Candidate Position*
        </label>
        <Input
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            placeholder="e.g., Incumbent Mayor, City Council Candidate"
            className={`${errors.position ? "border-red-500" : ""} w-full`}
            style={{ width: "100%" }}  // Ensure full width
        />
        {errors.position && (
            <p className="text-red-500 text-xs mt-1">{errors.position}</p>
        )}
      </div>

      {/* Election */}
      <div className="space-y-2">
        <label htmlFor="electionId" className="block text-sm font-medium text-gray-700">
          Select Election*
        </label>
        
        {/* Display the selected election */}
        {formData.electionId && formData.electionId !== "new" && selectedElection && (
          <div className="flex items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded-xl shadow-sm">
            <div>
              <div className="font-medium">{selectedElection.position}</div>
              <div className="text-gray-600 text-sm">
                {selectedElection.city}, {selectedElection.state} • 
                {new Date(selectedElection.date).toLocaleDateString()}
              </div>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, electionId: "" }))}
              className="text-gray-400 hover:text-gray-600"
            >
              Clear
            </Button>
          </div>
        )}
        
        {/* Show search or "Create New Election" option if no election is selected */}
        {(!formData.electionId || formData.electionId === "new") && (
          <div className="space-y-2">
            {formData.electionId !== "new" && (
              <SearchBar 
                placeholder="Search for an election..." 
                apiEndpoint="/api/elections/search"
                shadow={false}
                onResultSelect={(election) => {
                  setFormData(prev => ({ ...prev, electionId: election.id.toString() }));
                  if (errors.electionId) {
                    setErrors(prev => ({ ...prev, electionId: undefined }));
                  }
                  
                }} 
              />
            )}
            
            <div className="flex items-center mt-2 text-purple-600 text-sm">
              <input
                type="checkbox"
                id="create-new-election"
                className="mr-2"
                checked={formData.electionId === "new"}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    electionId: e.target.checked ? "new" : "" 
                  }));
                  if (errors.electionId) {
                    setErrors(prev => ({ ...prev, electionId: undefined }));
                  }
                }}
              />
              <label htmlFor="create-new-election">I need to create a new election</label>
            </div>
          </div>
        )}
        
        {errors.electionId && (
          <p className="text-red-500 text-xs mt-1">{errors.electionId}</p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
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
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
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

      {/* Bio */}
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Candidate Biography*
        </label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Provide information about the candidate's background, experience, and qualifications..."
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Policies* ({formData.policies.length}/5)
        </label>
        
        <div className="flex gap-2">
          <Input
            id="newPolicy"
            value={newPolicy}
            onChange={(e:any) => setNewPolicy(e.target.value)}
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
            <li key={index} className="flex items-center bg-gray-50 p-2 rounded-md">
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

      {/* Website, LinkedIn */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Optional Contact Information</h3>
        
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
                    style={{ width: "100%" }}  // Ensure full width
                />
                    {errors.linkedin && (
                    <p className="text-red-500 text-xs">{errors.linkedin}</p>
                )}
            </div>
          </div>
        </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
          Additional Notes (Optional)
        </label>
        <Textarea
          id="additionalNotes"
          name="additionalNotes"
          rows={3}
          value={formData.additionalNotes}
          onChange={handleInputChange}
          placeholder="Any additional information about the candidate..."
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
          <span>Candidate information submitted successfully! Thank you for your contribution.</span>
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
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit Candidate"
          )}
        </Button>
      </div>
    </form>
  );
}