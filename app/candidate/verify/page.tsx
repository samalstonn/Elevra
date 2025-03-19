"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaCheckCircle, FaArrowLeft, FaIdCard, FaInfoCircle } from "react-icons/fa";
import { Button } from "../../../components/ui/button";


interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  position?: string;
  govId?: string;
  proofOfCandidacy?: string;
  agreeToTerms?: string;
}

function CandidateVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    position: string;
    website: string;
    linkedin: string;
    twitter: string;
    govId: File | null;
    proofOfCandidacy: File | null;
    additionalInfo: string;
    agreeToTerms: boolean;
  }>({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    website: "",
    linkedin: "",
    twitter: "",
    govId: null,
    proofOfCandidacy: null,
    additionalInfo: "",
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (candidateSlug) {
      const foundCandidate = candidates.find(
        (c) => normalizeSlug(c.name) === candidateSlug
      );
      
      if (foundCandidate) {
        setCandidate(foundCandidate);
        setFormData(prev => ({
          ...prev,
          fullName: foundCandidate.name,
          position: foundCandidate.position,
          website: foundCandidate.website || ""
        }));
      }
    }
  }, [candidateSlug]);

  if (!hydrated) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked, files } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "file") {
      if (files && files.length > 0) {
        setFormData({ ...formData, [name]: files[0] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error for this field when user makes changes
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.position.trim()) newErrors.position = "Position is required";
    if (!formData.govId) newErrors.govId = "Government ID is required";
    if (!formData.proofOfCandidacy) newErrors.proofOfCandidacy = "Proof of candidacy is required";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Successful submission
      setSubmitStatus("success");
      
      // Reset form
      setTimeout(() => {
        if (candidate) {
          router.push(`/candidate/${normalizeSlug(candidate.name)}?verified=pending`);
        } else {
          router.push("/");
        }
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 max-w-3xl"
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </Button>
        </div>
        <div className="bg-white p-6 md:p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto rounded-full flex items-center justify-center mb-4"
            >
      
            </motion.div>
              <div className="flex items-center justify-center gap-2">
                <FaCheckCircle className="text-purple-600 text-3xl" />
                <h1 className="text-2xl font-bold text-gray-900">Candidate Verification Request</h1>
              </div>
            {candidate && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Image
                  src={candidate.photo || '/default-profile.png'}
                  width={50}
                  height={50}
                  alt={candidate.name}
                  className="rounded-full shadow-sm"
                />
                <div>
                  <p className="font-semibold text-gray-900">{candidate.name}</p>
                  <p className="text-sm text-gray-600">{candidate.position}</p>
                </div>
              </div>
            )}
          </div>
          {submitStatus === "success" ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <FaCheckCircle className="text-green-600 text-3xl" />
              </motion.div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Request Submitted!</h2>
              <p className="text-gray-600">
                Thank you for submitting your verification request. Our team will review your information and update your profile accordingly. You will receive an email when the verification process is complete.
              </p>
            </div>
          ) : submitStatus === "error" ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
              >
                <FaInfoCircle className="text-red-600 text-3xl" />
              </motion.div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Submission Error</h2>
              <p className="text-gray-600 mb-4">
                There was an error submitting your verification request. Please try again later or contact support.
              </p>
              <Button
                variant="purple"
                size="lg"
                onClick={() => setSubmitStatus(null)}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className=" p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <FaIdCard /> Candidate Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Legal Name*
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>
      
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address*
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
      
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
      
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                      Position Running For*
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.position ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
                  </div>
      
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Campaign Website (optional)
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                  <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn (optional)
                  </label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter (optional)
                  </label>
                  <input
                    type="url"
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                </div>
              </div>
      
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information (optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Any additional information that may help verify your identity"
                />
              </div>
      
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${errors.agreeToTerms ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                      I certify that all information provided is accurate*
                    </label>
                    <p className="text-gray-500">
                      By checking this box, you agree to our{" "}
                      <Link href="/terms" className="text-purple-600 hover:text-purple-800 underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-purple-600 hover:text-purple-800 underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
      
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="purple"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaCheckCircle />
                      Continue Verification Request
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </Suspense>
  );
}

export default function CandidateVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CandidateVerificationForm />
    </Suspense>
  );
}